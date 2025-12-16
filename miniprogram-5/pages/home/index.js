import Message from 'tdesign-miniprogram/message/index';
import request from '~/api/request';
import { getImageUrl } from '~/utils/url';

Page({
  data: {
    enable: false,
    activeTab: 'all',
    bizFilter: 'ALL',
    posts: [],
    leftColumn: [],
    rightColumn: [],
    categories: [],
    selectedCategory: null,
    page: 1,
    pageSize: 10,
    total: 0,
    loading: false,
    leftHeight: 0,
    rightHeight: 0,
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
    const params = { page, pageSize, status: 'APPROVED' };
    if (activeTab !== 'all') params.type = activeTab;
    if (selectedCategory) params.categoryId = selectedCategory;

    try {
      const res = await request(`/posts?${this.buildQuery(params)}`);
      const { items = [], total = 0 } = res.data || {};
      
      if (append) {
        this.appendToWaterfall(items);
      } else {
        this.setData({ 
          posts: items,
          leftColumn: [],
          rightColumn: [],
          leftHeight: 0,
          rightHeight: 0,
        });
        this.distributeToWaterfall(items);
      }
      
      this.setData({ total, loading: false });
    } catch (e) {
      console.error('加载列表失败', e);
      this.setData({ loading: false });
    }
  },

  processItem(item) {
    item.createdAtText = this.formatTime(item.createdAt);
    item.bizStatus = item.bizStatus || 'OPEN';
    item.bizStatusText = item.bizStatus === 'CLOSED'
      ? (item.type === 'LOST' ? '已找回' : '已认领')
      : '';
    if (item.images && item.images.length > 0) {
      item.images = item.images.map(img => ({
        ...img,
        url: getImageUrl(img.url)
      }));
    }
    return item;
  },

  distributeToWaterfall(items) {
    const leftColumn = [];
    const rightColumn = [];
    
    items.forEach((item, index) => {
      this.processItem(item);
      if (index % 2 === 0) {
        leftColumn.push(item);
      } else {
        rightColumn.push(item);
      }
    });
    
    this.setData({ leftColumn, rightColumn });
  },

  appendToWaterfall(items) {
    const { leftColumn, rightColumn, posts } = this.data;
    const newLeft = [...leftColumn];
    const newRight = [...rightColumn];
    const startIndex = posts.length;
    
    items.forEach((item, index) => {
      this.processItem(item);
      if ((startIndex + index) % 2 === 0) {
        newLeft.push(item);
      } else {
        newRight.push(item);
      }
    });
    
    this.setData({ 
      posts: [...posts, ...items],
      leftColumn: newLeft, 
      rightColumn: newRight 
    });
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

  buildQuery(params) {
    return Object.keys(params)
      .filter((k) => params[k] !== undefined && params[k] !== null)
      .map((k) => `${k}=${encodeURIComponent(params[k])}`)
      .join('&');
  },

  onNavTabTap(e) {
    const activeTab = e.currentTarget.dataset.value;
    if (activeTab === this.data.activeTab) return;
    this.setData({ activeTab, page: 1, posts: [], leftColumn: [], rightColumn: [] });
    this.loadPosts();
  },

  onCategoryChange(e) {
    const selectedCategory = e.detail.value || null;
    this.setData({ selectedCategory, page: 1, posts: [], leftColumn: [], rightColumn: [] });
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

  onImageLoad(e) {
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
