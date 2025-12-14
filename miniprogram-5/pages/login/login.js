import request from '~/api/request';

Page({
  data: {
    loading: false,
  },

  async wechatLogin() {
    if (this.data.loading) return;
    this.setData({ loading: true });

    try {
      // 获取微信登录 code
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject,
        });
      });

      // 获取用户信息
      let userInfo = { nickname: '微信用户', avatarUrl: '' };
      try {
        const profileRes = await new Promise((resolve, reject) => {
          wx.getUserProfile({
            desc: '用于完善用户资料',
            success: resolve,
            fail: reject,
          });
        });
        userInfo = profileRes.userInfo;
      } catch (e) {
        console.log('用户拒绝授权，使用默认信息');
      }

      // 调用后端登录接口
      const res = await request('/auth/wechat-login', 'POST', {
        code: loginRes.code,
        nickname: userInfo.nickName || userInfo.nickname,
        avatarUrl: userInfo.avatarUrl,
      });

      // 保存 token
      wx.setStorageSync('access_token', res.data.token);
      wx.setStorageSync('user_info', res.data.user);

      wx.showToast({ title: '登录成功', icon: 'success' });

      setTimeout(() => {
        wx.switchTab({ url: '/pages/my/index' });
      }, 1000);
    } catch (e) {
      console.error('登录失败', e);
      wx.showToast({ title: e.data?.message || '登录失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  goBack() {
    wx.navigateBack();
  },
});
