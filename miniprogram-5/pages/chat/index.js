import request from '~/api/request';

Page({
  data: {
    post: null,
    comments: [],
    commentInput: '',
    loading: true,
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
      const post = res.data;
      this.setData({
        post,
        comments: post.comments || [],
        loading: false,
      });
    } catch (e) {
      console.error('加载详情失败', e);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  previewImage(e) {
    const { url } = e.currentTarget.dataset;
    const urls = this.data.post.images.map((img) => img.url);
    wx.previewImage({ current: url, urls });
  },

  onCommentInput(e) {
    this.setData({ commentInput: e.detail.value });
  },

  async submitComment() {
    const { commentInput, post } = this.data;
    if (!commentInput.trim()) {
      return wx.showToast({ title: '请输入留言内容', icon: 'none' });
    }

    const token = wx.getStorageSync('access_token');
    if (!token) {
      return wx.showToast({ title: '请先登录', icon: 'none' });
    }

    try {
      const res = await request(`/posts/${post.id}/comments`, 'POST', {
        content: commentInput,
      });
      const comments = [res.data, ...this.data.comments];
      this.setData({ comments, commentInput: '' });
      wx.showToast({ title: '留言成功', icon: 'success' });
    } catch (e) {
      console.error('留言失败', e);
      wx.showToast({ title: '留言失败', icon: 'none' });
    }
  },

  makeCall() {
    const phone = this.data.post?.contactPhone;
    if (phone && !phone.includes('*')) {
      wx.makePhoneCall({ phoneNumber: phone });
    } else {
      wx.showToast({ title: '联系方式已脱敏', icon: 'none' });
    }
  },
});
