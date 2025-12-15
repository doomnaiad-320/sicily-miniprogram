import request from '~/api/request';
import config from '~/config';

Page({
  data: {
    type: 'LOST',
    originFiles: [],
    gridConfig: { column: 4, width: 160, height: 160 },
    categories: [],
    categoryId: null,
    description: '',
    locationText: '',
    locationLat: null,
    locationLng: null,
    contactPhone: '',
    tags: [],
    suggestedTags: [],
    submitting: false,
  },

  async onLoad() {
    await this.loadCategories();
  },

  async loadCategories() {
    try {
      const res = await request('/categories');
      this.setData({ categories: res.data || [] });
    } catch (e) {
      console.error('加载分类失败', e);
    }
  },

  onTypeChange(e) {
    this.setData({ type: e.detail.value });
  },

  onCategoryChange(e) {
    this.setData({ categoryId: e.detail.value });
  },

  onDescChange(e) {
    this.setData({ description: e.detail.value });
  },

  onPhoneChange(e) {
    this.setData({ contactPhone: e.detail.value });
  },

  async handleUploadSuccess(e) {
    const { files } = e.detail;
    this.setData({ originFiles: files });
  },

  async uploadImage(file) {
    wx.showLoading({ title: '上传中...' });
    try {
      const uploadRes = await new Promise((resolve, reject) => {
        wx.uploadFile({
          url: `${config.baseUrl}/upload`,
          filePath: file.url,
          name: 'file',
          header: {
            Authorization: `Bearer ${wx.getStorageSync('access_token')}`,
          },
          success: (res) => resolve(JSON.parse(res.data)),
          fail: reject,
        });
      });

      const files = this.data.originFiles.map((f) =>
        f.url === file.url ? { ...f, url: uploadRes.url, uploaded: true } : f
      );
      this.setData({ originFiles: files });
    } catch (e) {
      console.error('上传失败', e);
      wx.showToast({ title: '上传失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  handleRemove(e) {
    const { index } = e.detail;
    const files = [...this.data.originFiles];
    files.splice(index, 1);
    this.setData({ originFiles: files });
  },

  async getLocation() {
    wx.showLoading({ title: '获取位置...' });
    try {
      const res = await new Promise((resolve, reject) => {
        wx.getLocation({
          type: 'gcj02',
          success: resolve,
          fail: reject,
        });
      });
      this.setData({
        locationLat: res.latitude,
        locationLng: res.longitude,
      });
      wx.hideLoading();
      wx.showToast({ title: '定位成功', icon: 'success' });
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: '定位失败，请手动输入', icon: 'none' });
    }
  },

  onLocationTextChange(e) {
    this.setData({ locationText: e.detail.value });
  },

  toggleTag(e) {
    const { tag } = e.currentTarget.dataset;
    let tags = [...this.data.tags];
    if (tags.includes(tag)) {
      tags = tags.filter((t) => t !== tag);
    } else {
      tags.push(tag);
    }
    this.setData({ tags });
  },

  async submit() {
    const { type, originFiles, categoryId, description, locationText, locationLat, locationLng, contactPhone, tags } = this.data;

    if (originFiles.length < 2) {
      return wx.showToast({ title: '请至少上传2张图片', icon: 'none' });
    }
    if (!categoryId) {
      return wx.showToast({ title: '请选择分类', icon: 'none' });
    }
    if (!description || description.length < 10) {
      return wx.showToast({ title: '描述至少10个字', icon: 'none' });
    }
    if (!locationText) {
      return wx.showToast({ title: '请填写位置描述', icon: 'none' });
    }

    // 上传所有未上传的图片
    wx.showLoading({ title: '提交中...' });
    this.setData({ submitting: true });

    try {
      const images = [];
      for (const file of originFiles) {
        if (file.uploaded) {
          images.push(file.url);
        } else {
          const uploadRes = await new Promise((resolve, reject) => {
            wx.uploadFile({
              url: `${config.baseUrl}/upload`,
              filePath: file.url,
              name: 'file',
              header: {
                Authorization: `Bearer ${wx.getStorageSync('access_token')}`,
              },
              success: (res) => resolve(JSON.parse(res.data)),
              fail: reject,
            });
          });
          images.push(uploadRes.url);
        }
      }

      await request('/posts', 'POST', {
        type,
        categoryId,
        description,
        images,
        locationLat,
        locationLng,
        locationText,
        contactPhone,
        tags,
      });

      wx.hideLoading();
      wx.reLaunch({ url: '/pages/home/index?oper=release' });
    } catch (e) {
      wx.hideLoading();
      console.error('发布失败', e);
      wx.showToast({ title: e.data?.message || '发布失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },
});
