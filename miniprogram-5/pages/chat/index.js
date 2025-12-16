import request from '~/api/request';
import config from '~/config';
import { getImageUrl } from '~/utils/url';

Page({
  data: {
    post: null,
    comments: [],
    commentInput: '',
    commentImage: '',
    loading: true,
    currentImageIndex: 0,
    maskedPhone: '',
    isMyPost: false,
    allowClosedActions: false,
  },

  async onLoad(options) {
    const { id } = options;
    if (id) {
      await this.loadPost(id);
    }
  },

  async loadPost(id) {
    this.setData({ loading: true });
    try {
      const res = await request(`/posts/${id}`);
      const post = this.normalizePost(res.data);
      post.createdAtText = this.formatTime(post.createdAt);
      
      if (post.images && post.images.length > 0) {
        post.images = post.images.map(img => ({
          ...img,
          url: getImageUrl(img.url)
        }));
      }
      
      const comments = (post.comments || []).map(c => ({
        ...c,
        createdAtText: this.formatTime(c.createdAt),
        imageUrl: getImageUrl(c.imageUrl),
        user: c.user ? { ...c.user, avatarUrl: getImageUrl(c.user.avatarUrl) } : null
      }));
      
      if (post.user) {
        post.user.avatarUrl = getImageUrl(post.user.avatarUrl);
      }
      
      const maskedPhone = this.maskPhone(post.contactPhone);
      
      const userInfo =
        wx.getStorageSync('user_info') || wx.getStorageSync('userInfo');
      const isMyPost =
        userInfo &&
        post.user &&
        userInfo.id !== undefined &&
        userInfo.id !== null &&
        String(userInfo.id) === String(post.user.id);
      
      this.setData({
        post,
        comments,
        maskedPhone,
        isMyPost,
        allowClosedActions: false,
        loading: false,
      });
    } catch (e) {
      console.error('加载详情失败', e);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  maskPhone(phone) {
    if (!phone) return '';
    if (phone.length === 11) {
      return phone.substring(0, 3) + '****' + phone.substring(7);
    }
    if (phone.length > 4) {
      return phone.substring(0, 2) + '****' + phone.substring(phone.length - 2);
    }
    return '****';
  },

  formatTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  },

  normalizePost(post) {
    const bizStatus = post?.bizStatus || 'OPEN';
    const bizStatusText =
      bizStatus === 'CLOSED'
        ? (post?.type === 'LOST' ? '已找回' : '已认领')
        : '进行中';
    const closedReasonText = this.getClosedReasonText(post?.type, post?.closedReason);
    const closedAtText = post?.closedAt ? this.formatTime(post.closedAt) : '';

    return {
      ...post,
      bizStatus,
      bizStatusText,
      closedReasonText,
      closedAtText,
      closedRemark: post?.closedRemark || '',
    };
  },

  getClosedReasonText(type, reason) {
    if (!reason) return '';
    const code = String(reason).toUpperCase();
    if (type === 'LOST') {
      const map = {
        RECOVERED: '已找回',
        GAVE_UP: '不找了',
        OTHER: '其他',
      };
      return map[code] || '其他';
    }
    if (type === 'FOUND') {
      const map = {
        CLAIMED: '已认领',
        HANDED_OVER: '已移交',
        OTHER: '其他',
      };
      return map[code] || '其他';
    }
    return '其他';
  },

  ensureClosedActionsAllowed(continueFn) {
    if (this.data.post?.bizStatus !== 'CLOSED' || this.data.allowClosedActions) {
      if (typeof continueFn === 'function') continueFn();
      return;
    }

    wx.showModal({
      title: '信息已结束',
      content: '该信息已结束，默认不支持联系/留言。仍要继续吗？',
      confirmText: '继续',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.setData({ allowClosedActions: true });
          if (typeof continueFn === 'function') continueFn();
        }
      },
    });
  },

  confirmEnableClosedActions() {
    this.ensureClosedActionsAllowed(() => {
      wx.showToast({ title: '已临时开启', icon: 'none' });
    });
  },

  previewImage(e) {
    const { url } = e.currentTarget.dataset;
    const urls = this.data.post.images.map((img) => img.url);
    wx.previewImage({ current: url, urls });
  },

  previewCommentImage(e) {
    const { url } = e.currentTarget.dataset;
    wx.previewImage({ current: url, urls: [url] });
  },

  onCommentInput(e) {
    this.setData({ commentInput: e.detail.value });
  },

  chooseCommentImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({ commentImage: res.tempFiles[0].tempFilePath });
      }
    });
  },

  removeCommentImage() {
    this.setData({ commentImage: '' });
  },

  async uploadImage(filePath) {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: `${config.baseUrl}/upload`,
        filePath: filePath,
        name: 'file',
        header: {
          Authorization: `Bearer ${wx.getStorageSync('access_token')}`,
        },
        success: (res) => {
          const data = JSON.parse(res.data);
          resolve(data.url);
        },
        fail: reject,
      });
    });
  },

  async submitComment() {
    const { commentInput, commentImage, post } = this.data;
    if (post?.bizStatus === 'CLOSED' && !this.data.allowClosedActions) {
      return this.ensureClosedActionsAllowed(() => this.submitComment());
    }
    if (!commentInput.trim() && !commentImage) {
      return wx.showToast({ title: '请输入留言内容或选择图片', icon: 'none' });
    }

    const token = wx.getStorageSync('access_token');
    if (!token) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再留言',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/login/login' });
          }
        }
      });
      return;
    }

    wx.showLoading({ title: '发送中...' });

    try {
      let imageUrl = '';
      if (commentImage) {
        imageUrl = await this.uploadImage(commentImage);
      }

      const res = await request(`/posts/${post.id}/comments`, 'POST', {
        content: commentInput,
        imageUrl: imageUrl,
      });
      const newComment = {
        ...res.data,
        createdAtText: this.formatTime(res.data.createdAt)
      };
      const comments = [newComment, ...this.data.comments];
      this.setData({ comments, commentInput: '', commentImage: '' });
      wx.hideLoading();
      wx.showToast({ title: '留言成功', icon: 'success' });
    } catch (e) {
      wx.hideLoading();
      console.error('留言失败', e);
      wx.showToast({ title: e.data?.error || '留言失败', icon: 'none' });
    }
  },

  makeCall() {
    this.ensureClosedActionsAllowed(() => {
      const phone = this.data.post?.contactPhone;
      if (phone) {
        wx.showModal({
          title: '联系发布者',
          content: `确定要拨打 ${this.data.maskedPhone} 吗？`,
          confirmText: '拨打',
          success: (res) => {
            if (res.confirm) {
              wx.makePhoneCall({ phoneNumber: phone });
            }
          }
        });
      }
    });
  },

  goBack() {
    wx.navigateBack();
  },

  goToChat(e) {
    this.ensureClosedActionsAllowed(() => {
      const { userId } = e.currentTarget.dataset;
      const token = wx.getStorageSync('access_token');
      if (!token) {
        wx.showModal({
          title: '提示',
          content: '请先登录后再私信',
          confirmText: '去登录',
          success: (res) => {
            if (res.confirm) {
              wx.navigateTo({ url: '/pages/login/login' });
            }
          }
        });
        return;
      }
      wx.navigateTo({ url: `/pages/message/chat/index?targetUserId=${userId}` });
    });
  },
});
