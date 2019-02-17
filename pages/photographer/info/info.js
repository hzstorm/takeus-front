// pages/requirement/submit/submit.js

// pages/requirement/make/make.js
var api = require('../../../api.js');
var app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    show: false,
    label_list: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    var page = this;

    console.log(options);

    page.loadPhotographerInfo();



  },
  labelInput: function(e) {
    var page = this;
    page.setData({
      label: e.detail.value
    })


  },


  addLabel: function(e) {
    var page = this;
    page.setData({
      show: true
    })

  },



  submit: function(e) {
    var page = this;
    var label = page.data.label;
    app.request({
      url: api.photographer.add_label,
      data: {
        content:label
      },
      success: function(e) {
        
        if (e.code == 0) {
              var label_list=e.label_list
              page.setData({
                label_list:label_list,
                show:false
              })
           
        } else {
          wx.showModal({
            title: '提示',
            content: e.msg,
          })

        }
      }
    })
  },

  loadPhotographerInfo: function(e) {

    var page = this;

    app.request({
      url: api.photographer.my_info,

      success: function(e) {
        console.log(e);
        if (e.code == 0) {
          page.setData({
            photographer: e.data,
            label_list: e.label_list
          })

        } else {
          wx.showToast({
            title: e.msg,
          })
        }
      }
    })

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