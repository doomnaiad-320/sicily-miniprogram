import Message from 'tdesign-miniprogram/message/index';
import request from '~/api/request';

Page({
  data: {
    enable: false,
    activeTab: 'all',
    posts: [],
    categories: [],
    selectedCategory: null,
    page: 1,
    pageSize: 10,
    total: 0,
    loading: false,
  },

  async onLoad(option) {
    await this.loadCategories();
    await this.loadPosts();
    if (option.oper === 'release') {
      this.showOperMsg('发布成功，等待审核');
    }
  },

  async loadCategories() {
    try {
      const res = await request('/categories');
      this.setData({ categories: res.data || [] });
    } catch (e) {
      console.error('加载分类失败', e);
    }
  },

  async loadPosts(append = false) {
    if (this.data.loading) return;
    this.setData({ loading: true });

    const { activeTab, selectedCategory, page, pageSize } = this.data;
    const params = { page, pageSize };
    if (activeTab !== 'all') params.type = activeTab;
    if (selectedCategory) params.categoryId = selectedCategory;

    try {
      const res = await request(`/posts?${this.buildQuery(params)}`);
      const { items = [], total = 0 } = res.data || {};
      this.setData({
        posts: append ? [...this.data.posts, ...items] : items,
        total,
        loading: false,
      });
    } catch (e) {
      console.error('加载列表失败', e);
      this.setData({ loading: false });
    }
  },

  buildQuery(params) {
    return Object.keys(params)
      .filter((k) => params[k] !== undefined && params[k] !== null)
      .map((k) => `${k}=${encodeURIComponent(params[k])}`)
      .join('&');
  },

  onTabChange(e) {
    const activeTab = e.detail.value;
    this.setData({ activeTab, page: 1, posts: [] });
    this.loadPosts();
  },

  onCategoryChange(e) {
    const selectedCategory = e.detail.value || null;
    this.setData({ selectedCategory, page: 1, posts: [] });
    this.loadPosts();
  },

  onRefresh() {
    this.setData({ enable: true, page: 1 });
    this.loadPosts().then(() => {
      this.setData({ enable: false });
    });
  },

  onReachBottom() {
    const { posts, total, page, pageSize } = this.data;
    if (posts.length < total) {
      this.setData({ page: page + 1 });
      this.loadPosts(true);
    }
  },

  goDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/chat/index?id=${id}` });
  },

  goRelease() {
    wx.navigateTo({ url: '/pages/release/index' });
  },

  showOperMsg(content) {
    Message.success({
      context: this,
      offset: [120, 32],
      duration: 4000,
      content,
    });
  },
});
