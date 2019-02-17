// pages/requirement/make/make.js
var api = require('../../../api.js');
var app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    index: 0,
    level_index: 0,
    type_index: 0,
    level_list: [],
    location: '',

    end: '2100-01-01',
    time: '00:00',
    hide: false,
    address: '',
    currentTab: 0,
    pageNum: 1,
    photographer_list: [],
    hide_none: true,
    sum: 0
  },



  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {

    var page = this;
    page.initDateTime();

    page.loadData();

  },



  detail: function(e) {
    console.log(e);
    this.setData({
      detail: e.detail.value
    })





  },
  bindTypeChange: function(e) {
    var page = this;
    var type_index = e.detail.value;
    var type_list = page.data.type_list
    page.setData({
      type_index: type_index,
      type_id: type_list[type_index].id
    })
  },

  bindTimeChange: function(e) {
    console.log(e);
    this.setData({
      time: e.detail.value
    })
  },
  bindDateChange: function(e) {
    console.log(e);
    this.setData({
      date: e.detail.value
    })
  },

  bindLevelChange: function(e) {
    console.log(e);

    var page = this;

    // var level_index = e.detail.value;

    var cur = e.target.dataset.current;

    var level_list = page.data.level_list
    page.setData({
      level_index: cur,
      level_id: level_list[cur].id,
      currentTab: cur,

    })
  },
  initDateTime: function(e) {
    var date = new Date();
    date = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
    var page = this;
    page.setData({
      date: date,
      start: date
    })
  },


  next: function(e) {


        console.log(e);


    var page = this;

    var form_id = e.detail.formId;
    var type_id = page.data.type_id;
    var date = page.data.date;
    var time = page.data.time;
    var level_id = page.data.level_id;
    var address = page.data.location + "  " + e.detail.value.detail;
    var lat = page.data.lattitude;
    var lon = page.data.longitude;
    page.setData({
      form_id: form_id
    })
    var option = {
      type_id: type_id,
      time: time,
      date: date,
      level_id: level_id,
      address: address,
      lat: lat,
      lon: lon,

    }
    wx.setStorageSync("m_option", option);
    // if (address == '') {
    //   wx.showModal({
    //     title: '提示',
    //     content: '请选择地理位置',
    //   })
    //   return;
    // }
    var address = '测试';
    page.setData({
      hide: true
    })

    //查找摄影师
    wx.showLoading({
      title: '加载中...',
    })

    page.loadPhotographerList();
    wx.setNavigationBarTitle({
      title: '选择摄影师',
    })

  },

  chooseLocation: function(e) {
    var page = this;
    wx.chooseLocation({
      success: function(res) {
        var address = res.address;
        var latitude = res.latitude;
        var longitude = res.longitude;
        page.setData({
          lattitude: latitude,
          longitude: longitude,
          location: address
        })




      },
      fail: function(res) {},
      complete: function(res) {},
    })

  },

  loadPhotographerList: function(e) {
    var page = this;

    var type_id = page.data.type_id;
    var date = page.data.date;
    var time = page.data.time;
    var level_id = page.data.level_id;
    var address = page.data.location;
    var lat = page.data.lattitude;
    var lon = page.data.longitude;
    var pageNum = page.data.pageNum
    var form_id=page.data.form_id
    app.request({
      url: api.requirement.area_photographer,
      data: {
        u_lat: lat,
        u_lon: lon,
        level_id: level_id,
        type_id: type_id,
        form_id:form_id,
        page: 1
      },
      success: function(e) {
        if (e.code == 0) {


          var photographer_list = page.data.photographer_list.concat(e.data.list);


          page.setData({
            photographer_list: photographer_list,
            sum: (e.data.sum - photographer_list.length)

          });

          if (photographer_list.length == 0) {
            page.setData({
              hide_none: false
            });
          }
          if (e.data.list.length == 0) {

            page.setData({
              is_no_more: true
            });


          }
        } else {
          wx.showModal({
            title: '提示',
            content: e.msg,
            success: function(e) {
              page.setData({
                hide: false
              })
            }
          })
        }

        wx.hideLoading();

      }
    })
  },

  onReachBottom: function(e) {
    var page = this;
    if (page.data.is_no_more) {
      page.setData({
        pageNum: page.data.pageNum++
      })
      page.loadPhotographerList();
    } else {
      wx.showToast({
        title: '没有更多摄影师咯!',
      })
    }



  },




  loadData: function(e) {
    var page = this;
    //摄影师级别
    app.request({
      url: api.photographer.level_list,
      success: function(e) {

        console.log(e);
        if (e.data.length) {
          page.setData({
            level_list: e.data,
            level_id: e.data[0].id
          })
        } else {
          wx.showToast({
            title: '无法获取到摄影师等级',
          })
          wx.navigateBack({
            delta: 1
          })
        }
      }
    })
    //需求类型

    app.request({
      url: api.requirement.type_list,
      success: function(e) {

        console.log(e);
        if (e.data.length) {
          page.setData({
            type_list: e.data,
            type_id: e.data[0].id
          })
        } else {
          wx.showToast({
            title: '无法获取到需求分类',
          })
          wx.navigateBack({
            delta: 1
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