import request from '~/api/request';
import { getImageUrl } from '~/utils/url';
import config from '~/config';

Page({
  data: {
    conversationId: null,
    otherUser: null,
    messages: [],
    inputValue: '',
    loading: true,
    sending: false,
    currentUserId: null,
    scrollToView: '',
  },

  getCurrentUserId() {
    const userInfo =
      wx.getStorageSync('user_info') || wx.getStorageSync('userInfo');
    const id = userInfo && userInfo.id;
    if (id === undefined || id === null) return null;
    return String(id);
  },

  onLoad(options) {
    const { conversationId, targetUserId } = options;
    const currentUserId = this.getCurrentUserId();
    this.setData({ currentUserId });

    if (conversationId) {
      this.setData({ conversationId: parseInt(conversationId) });
      this.loadConversation();
      this.loadMessages();
    } else if (targetUserId) {
      this.createOrGetConversation(parseInt(targetUserId));
    }
  },

  onShow() {
    const currentUserId = this.getCurrentUserId();
    if (currentUserId !== this.data.currentUserId) {
      this.setData({ currentUserId });
      if (this.data.conversationId) {
        this.loadMessages();
      }
    }
  },

  async createOrGetConversation(targetUserId) {
    try {
      const res = await request('/conversations', 'POST', { targetUserId });
      this.setData({ conversationId: res.data.conversation.id });
      this.loadConversation();
      this.loadMessages();
    } catch (e) {
      console.error('创建会话失败', e);
      wx.showToast({ title: '创建会话失败', icon: 'none' });
    }
  },

  async loadConversation() {
    try {
      const res = await request(`/conversations/${this.data.conversationId}`);
      const conv = res.data.conversation;
      const otherUser = {
        ...conv.otherUser,
        avatarUrl: getImageUrl(conv.otherUser.avatarUrl),
      };
      this.setData({ otherUser });
      wx.setNavigationBarTitle({ title: otherUser.nickname });
    } catch (e) {
      console.error('加载会话信息失败', e);
    }
  },

  async loadMessages() {
    this.setData({ loading: true });
    try {
      const res = await request(
        `/conversations/${this.data.conversationId}/messages`
      );
      const currentUserId = this.data.currentUserId;
      const messages = (res.data.messages || []).map((msg) => ({
        ...msg,
        sender: {
          ...msg.sender,
          avatarUrl: getImageUrl(msg.sender.avatarUrl),
        },
        imageUrl: getImageUrl(msg.imageUrl),
        timeText: this.formatTime(msg.createdAt),
        isMine: currentUserId != null && String(msg.senderId) === currentUserId,
      }));
      this.setData({ messages, loading: false });
      this.scrollToBottom();
    } catch (e) {
      console.error('加载消息失败', e);
      this.setData({ loading: false });
    }
  },

  formatTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  },

  scrollToBottom() {
    setTimeout(() => {
      const lastMsg = this.data.messages[this.data.messages.length - 1];
      if (lastMsg) {
        this.setData({ scrollToView: `msg-${lastMsg.id}` });
      }
    }, 100);
  },

  onInputChange(e) {
    this.setData({ inputValue: e.detail.value });
  },

  async sendMessage() {
    const content = this.data.inputValue.trim();
    if (!content || this.data.sending) return;

    this.setData({ sending: true, inputValue: '' });
    try {
      const res = await request(
        `/conversations/${this.data.conversationId}/messages`,
        'POST',
        { content }
      );
      const msg = res.data.message;
      const newMsg = {
        ...msg,
        sender: {
          ...msg.sender,
          avatarUrl: getImageUrl(msg.sender.avatarUrl),
        },
        timeText: this.formatTime(msg.createdAt),
        isMine: true,
      };
      this.setData({
        messages: [...this.data.messages, newMsg],
        sending: false,
      });
      this.scrollToBottom();
    } catch (e) {
      console.error('发送失败', e);
      wx.showToast({ title: '发送失败', icon: 'none' });
      this.setData({ sending: false });
    }
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.uploadAndSendImage(tempFilePath);
      },
    });
  },

  async uploadAndSendImage(filePath) {
    wx.showLoading({ title: '发送中...' });
    try {
      const uploadRes = await new Promise((resolve, reject) => {
        wx.uploadFile({
          url: `${config.baseUrl}/upload`,
          filePath,
          name: 'file',
          header: {
            Authorization: `Bearer ${wx.getStorageSync('access_token')}`,
          },
          success: (res) => resolve(JSON.parse(res.data)),
          fail: reject,
        });
      });

      const res = await request(
        `/conversations/${this.data.conversationId}/messages`,
        'POST',
        { content: '', imageUrl: uploadRes.url }
      );
      const msg = res.data.message;
      const newMsg = {
        ...msg,
        sender: {
          ...msg.sender,
          avatarUrl: getImageUrl(msg.sender.avatarUrl),
        },
        imageUrl: getImageUrl(msg.imageUrl),
        timeText: this.formatTime(msg.createdAt),
        isMine: true,
      };
      this.setData({ messages: [...this.data.messages, newMsg] });
      this.scrollToBottom();
    } catch (e) {
      console.error('发送图片失败', e);
      wx.showToast({ title: '发送失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  previewImage(e) {
    const { url } = e.currentTarget.dataset;
    wx.previewImage({ urls: [url], current: url });
  },
});
