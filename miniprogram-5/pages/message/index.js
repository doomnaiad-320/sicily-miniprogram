import request from '~/api/request';
import { getImageUrl } from '~/utils/url';

Page({
  data: {
    conversations: [],
    loading: true,
  },

  onLoad() {
    this.loadConversations();
  },

  onShow() {
    this.loadConversations();
  },

  onPullDownRefresh() {
    this.loadConversations().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  async loadConversations() {
    this.setData({ loading: true });
    try {
      const res = await request('/conversations');
      const conversations = (res.data.conversations || []).map((conv) => ({
        ...conv,
        otherUser: {
          ...conv.otherUser,
          avatarUrl: getImageUrl(conv.otherUser.avatarUrl),
        },
        lastMessage: conv.lastMessage
          ? {
              ...conv.lastMessage,
              timeText: this.formatTime(conv.lastMessage.createdAt),
            }
          : null,
      }));
      this.setData({ conversations, loading: false });
    } catch (e) {
      console.error('加载会话列表失败', e);
      this.setData({ loading: false });
    }
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
    return `${month}/${day}`;
  },

  toChat(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/message/chat/index?conversationId=${id}` });
  },
});
