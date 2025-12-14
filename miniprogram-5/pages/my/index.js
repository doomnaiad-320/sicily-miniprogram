import request from '~/api/request';

Page({
  data: {
    isLoggedIn: false,
    userInfo: null,
    myPosts: [],
    activeTab: 'all',
    loading: false,
  },

  async onShow() {
    const token = wx.getStorageSync('access_token');
    if (token) {
      this.setData({ isLoggedIn: true });
      await this.loadUserInfo();
      await this.loadMyPosts();
    } else {
      this.setData({ isLoggedIn: false, userInfo: null, myPosts: [] });
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
      this.setData({ myPosts: res.data.items || [], loading: false });
    } catch (e) {
      console.error('加载我的发布失败', e);
      this.setData({ loading: false });
    }
  },

  onTabChange(e) {
    this.setData({ activeTab: e.detail.value });
    this.loadMyPosts();
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
});
