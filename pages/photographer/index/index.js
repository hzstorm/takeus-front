// pages/photograper/index/index.js

var api = require('../../../api.js');
var utils = require('../../../utils.js');
var app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    data1:0.00,
    data2:0,
    data3:0
  },

  navigatorSubmit: function (e) {
    app.request({
      url: api.user.save_form_id + "&form_id=" + e.detail.formId,
    });
    wx.navigateTo({
      url: e.detail.value.url,
    });
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {

    var page = this;
        page.checkUserStatus();
        




   page.initData();
  },
  initData:function(e){
     var page=this;
     app.request({
       url:api.photographer.index,
       success:function(e){
        if(e.code==0){
          page.setData(e.data)
        }else{
             
        }
       }
     })
  },
  checkUserStatus: function(e) {
  var user=  wx.getStorageSync('user_info');
    var money=user.money;

    var page=this;
    page.setData({
      money:money
    })
   app.request({
     url:api.photographer.my_info,
     success:function(e){
         if(e.code!=1){
             if(e.data.status==0){
               wx.redirectTo({
                 url: '/pages/user/user',
               })
               return;
               wx.showModal({
                 title: '提示',
                 content: '摄影资格审核中，请等待...',
                 success:function(e){
                   wx.redirectTo({
                     url: '/pages/user/user',
                   })
                 }
               })
             }
         }else{
           wx.redirectTo({
             url: '/pages/photographer/apply/apply',
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