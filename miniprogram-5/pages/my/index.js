import request from '~/api/request';
import { getImageUrl } from '~/utils/url';

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
      const posts = (res.data.posts || res.data.items || []).map(post => ({
        ...post,
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
