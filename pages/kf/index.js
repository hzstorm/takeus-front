// pages/kf/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var page=this;
    var service=wx.getStorageSync('store').service;
    page.setData({
      service:service
    })
  },

  previewImage:function(e)
{   
    var service = wx.getStorageSync('store').service;
   wx.previewImage({
     urls: [service],
   })

},
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },
  call:function(e){

     wx.makePhoneCall({
       phoneNumber: wx.getStorageSync('contact_tel'),
     })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})