import request from '~/api/request';
import { getImageUrl } from '~/utils/url';

Page({
  data: {
    isLoggedIn: false,
    userInfo: null,
    myPosts: [],
    activeTab: 'all',
    loading: false,
    actionPostId: null,
    actionPostType: '',
    closeDialogVisible: false,
    closeReasonOptions: [],
    closeReason: '',
    closeRemark: '',
    closeSubmitting: false,
    reopenDialogVisible: false,
    reopenReasonOptions: [
      { label: '误标结束', value: 'MISOPERATION' },
      { label: '信息仍未解决', value: 'NOT_SOLVED' },
      { label: '有新线索', value: 'NEW_CLUE' },
      { label: '其他', value: 'OTHER' },
    ],
    reopenReason: 'MISOPERATION',
    reopenRemark: '',
    reopenSubmitting: false,
  },

  async onShow() {
    try {
      const token = wx.getStorageSync('access_token');
      if (token) {
        this.setData({ isLoggedIn: true });
        await this.loadUserInfo();
        await this.loadMyPosts();
      } else {
        this.setData({ isLoggedIn: false, userInfo: null, myPosts: [] });
      }
    } catch (e) {
      console.error('我的页初始化失败', e);
      this.setData({ loading: false });
    }
  },

  async loadUserInfo() {
    try {
      const res = await request('/auth/me');
      this.setData({ userInfo: res.data });
    } catch (e) {
      console.error('获取用户信息失败', e);
    }
  },

  async loadMyPosts() {
    this.setData({ loading: true });
    const { activeTab } = this.data;
    const params = { page: 1, pageSize: 50 };
    if (activeTab !== 'all') {
      params.status = activeTab;
    }

    try {
      const query = Object.keys(params)
        .map((k) => `${k}=${params[k]}`)
        .join('&');
      const res = await request(`/me/posts?${query}`);
      const posts = (res.data.posts || res.data.items || []).map(post => ({
        ...post,
        bizStatus: post.bizStatus || 'OPEN',
        bizStatusText:
          post.bizStatus === 'CLOSED'
            ? (post.type === 'LOST' ? '已找回' : '已认领')
            : '',
        images: (post.images || []).map(img => ({
          ...img,
          url: getImageUrl(img.url)
        })),
        createdAtText: this.formatTime(post.createdAt)
      }));
      this.setData({ myPosts: posts, loading: false });
    } catch (e) {
      console.error('加载我的发布失败', e);
      this.setData({ loading: false });
    }
  },

  onTabChange(e) {
    const value = e.currentTarget.dataset.value;
    if (value === this.data.activeTab) return;
    this.setData({ activeTab: value });
    this.loadMyPosts().catch((err) => console.error('切换标签加载失败', err));
  },

  goDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/chat/index?id=${id}` });
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
  },

  goSetting() {
    wx.navigateTo({ url: '/pages/setting/index' });
  },

  getPostById(postId) {
    return (this.data.myPosts || []).find((p) => String(p.id) === String(postId));
  },

  openCloseDialog(e) {
    const { id } = e.currentTarget.dataset;
    const post = this.getPostById(id);
    if (!post) return;
    if (post.status !== 'APPROVED') {
      return wx.showToast({ title: '仅已通过的信息可标记结束', icon: 'none' });
    }
    if (post.bizStatus === 'CLOSED') {
      return wx.showToast({ title: '该信息已结束', icon: 'none' });
    }

    const options = post.type === 'FOUND'
      ? [
          { label: '已认领', value: 'CLAIMED' },
          { label: '已移交', value: 'HANDED_OVER' },
          { label: '其他', value: 'OTHER' },
        ]
      : [
          { label: '已找回', value: 'RECOVERED' },
          { label: '不找了', value: 'GAVE_UP' },
          { label: '其他', value: 'OTHER' },
        ];

    this.setData({
      actionPostId: post.id,
      actionPostType: post.type,
      closeDialogVisible: true,
      closeReasonOptions: options,
      closeReason: options[0]?.value || '',
      closeRemark: '',
    });
  },

  onCloseReasonChange(e) {
    this.setData({ closeReason: e.detail.value });
  },

  onCloseRemarkChange(e) {
    this.setData({ closeRemark: e.detail.value });
  },

  closeCloseDialog() {
    if (this.data.closeSubmitting) return;
    this.setData({ closeDialogVisible: false });
  },

  async confirmClosePost() {
    const postId = this.data.actionPostId;
    if (!postId || this.data.closeSubmitting) return;
    const reason = this.data.closeReason;
    if (!reason) {
      return wx.showToast({ title: '请选择结束原因', icon: 'none' });
    }

    this.setData({ closeSubmitting: true });
    wx.showLoading({ title: '提交中...' });
    try {
      await request(`/posts/${postId}/close`, 'PATCH', {
        reason,
        remark: this.data.closeRemark,
      });
      wx.hideLoading();
      wx.showToast({ title: '已标记结束', icon: 'success' });
      this.setData({ closeDialogVisible: false, closeSubmitting: false });
      this.loadMyPosts();
    } catch (e) {
      wx.hideLoading();
      console.error('标记结束失败', e);
      wx.showToast({ title: e.data?.error || '操作失败', icon: 'none' });
      this.setData({ closeSubmitting: false });
    }
  },

  openReopenDialog(e) {
    const { id } = e.currentTarget.dataset;
    const post = this.getPostById(id);
    if (!post) return;
    if (post.status !== 'APPROVED') {
      return wx.showToast({ title: '当前状态不支持重新开启', icon: 'none' });
    }
    if (post.bizStatus !== 'CLOSED') {
      return wx.showToast({ title: '该信息未结束', icon: 'none' });
    }

    this.setData({
      actionPostId: post.id,
      actionPostType: post.type,
      reopenDialogVisible: true,
      reopenReason: 'MISOPERATION',
      reopenRemark: '',
    });
  },

  onReopenReasonChange(e) {
    this.setData({ reopenReason: e.detail.value });
  },

  onReopenRemarkChange(e) {
    this.setData({ reopenRemark: e.detail.value });
  },

  closeReopenDialog() {
    if (this.data.reopenSubmitting) return;
    this.setData({ reopenDialogVisible: false });
  },

  async confirmReopenPost() {
    const postId = this.data.actionPostId;
    if (!postId || this.data.reopenSubmitting) return;
    const reason = this.data.reopenReason;
    if (!reason) {
      return wx.showToast({ title: '请选择重新开启原因', icon: 'none' });
    }

    this.setData({ reopenSubmitting: true });
    wx.showLoading({ title: '提交中...' });
    try {
      await request(`/posts/${postId}/reopen`, 'PATCH', {
        reason,
        remark: this.data.reopenRemark,
      });
      wx.hideLoading();
      wx.showToast({ title: '已重新开启，进入审核中', icon: 'success' });
      this.setData({ reopenDialogVisible: false, reopenSubmitting: false });
      this.loadMyPosts();
    } catch (e) {
      wx.hideLoading();
      console.error('重新开启失败', e);
      wx.showToast({ title: e.data?.error || '操作失败', icon: 'none' });
      this.setData({ reopenSubmitting: false });
    }
  },

  getStatusText(status) {
    const map = {
      PENDING: '审核中',
      APPROVED: '已通过',
      REJECTED: '已拒绝',
      OFFLINE: '已下架',
    };
    return map[status] || status;
  },

  getStatusClass(status) {
    const map = {
      PENDING: 'pending',
      APPROVED: 'approved',
      REJECTED: 'rejected',
      OFFLINE: 'offline',
    };
    return map[status] || '';
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
});
