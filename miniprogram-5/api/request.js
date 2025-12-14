import config from '~/config';

const { baseUrl } = config;

function request(url, method = 'GET', data = {}) {
  const header = {
    'content-type': 'application/json',
  };
  const tokenString = wx.getStorageSync('access_token');
  if (tokenString) {
    header.Authorization = `Bearer ${tokenString}`;
  }
  return new Promise((resolve, reject) => {
    wx.request({
      url: baseUrl + url,
      method,
      data,
      dataType: 'json',
      header,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res);
        } else {
          reject(res);
        }
      },
      fail(err) {
        reject(err);
      },
    });
  });
}

export default request;
