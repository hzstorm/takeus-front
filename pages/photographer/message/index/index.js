var api = require('../../../../api.js');
var utils = require('../../../../utils.js');
var app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    order_count: 0,
    desc: '暂无消息',
    has_order: false,


  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {

    var page = this;
    page.loadOrderMsg();
    page.loadMsg();

  },


  loadMsg: function(e) {
    var page = this;
    app.request({
      url: api.photographer.msg,
      success: function(e) {
        console.log(e)
        var order_count = e.data.order_msg.count
        var topic_count = e.data.topic_msg.count
        var money_count = e.data.money_msg.count

   


        page.setData({
          order_msg: e.data.order_msg,
          topic_msg: e.data.topic_msg,
          money_msg: e.data.money_msg
        })






      }
    })




  },
  loadOrderMsg: function(e) {
    var page = this;
    app.request({
      url: api.photographer.order_list,
      data: {
        status: 0
      },
      success: function(e) {
        if (e.code == 0) {
          page.setData({
            order_count: e.data.count,
            desc: '您有新的摄影订单，赶快处理吧！',
            has_order: true

          })
        } else {
          console.log("暂无数据")
        }
      }
    })
  },
  loadMoneyMsg: function() {




  },




  order: function(e) {
    var page = this;
    var order_count = page.data.order_msg.count;
    if (order_count) {
      wx.redirectTo({
        url: '/pages/photographer/order/order?status=1',
      })
    }


  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})