// pages/cash-detail/cash-detail.js
var api = require('../../../api.js');
var app = getApp();
var is_no_more = false;
var is_loading = false;
var p = 2;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    status: -1,
    cash_list: [],
    show_no_data_tip: false,
    record_list: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    app.pageOnLoad(this);


    var page = this;

    app.request({
      url: api.user.wallet_detail,
      success: function (res) {
        console.log(res);
        page.setData(res.data)

      }
    })

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },
  /*
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

    var page = this;
    if (is_loading || is_no_more)
      return;
    is_loading = true;
    app.request({
      url: api.share.cash_detail,
      data: {
        status: page.data.status,
        page: p,
      },
      success: function (res) {
        if (res.code == 0) {

          var cash_list = page.data.cash_list.concat(res.data.list);
          page.setData({
            cash_list: cash_list,
          });
          if (res.data.list.length == 0) {
            is_no_more = true;
          }
        }
        p++;
      },
      complete: function () {
        is_loading = false;
      }
    });
  },
})