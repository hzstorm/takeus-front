// pages/requirement/make/make.js
var api = require('../../../api.js');
var app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
coupon_id:0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    var option = wx.getStorageSync('m_option');
    console.log(option);
    var page = this;
    if (options.order_id) {
      page.setData({
        order_id: options.order_id
      })
      page.loadData();

    } else {
      wx.showModal({
        title: '提示',
        content: '发生错误,请稍后重试',
        success: function(e) {
          wx.navigateBack({
            delta: 1
          })
        }
      })
    }
  },
  showCouponPicker: function () {
    var page = this;
    page.getInputData();
    if (page.data.coupon_list && page.data.coupon_list.length > 0) {
      page.setData({
        show_coupon_picker: true,
      });
    }
  },
  pickCoupon: function (e) {
    var page = this;
    var index = e.currentTarget.dataset.index;
    var data = wx.getStorageSync('input_data');
    wx.removeStorageSync('input_data');
    if (index == '-1' || index == -1) {
      data.picker_coupon = false;
      data.show_coupon_picker = false;
    } else {
      data.picker_coupon = page.data.coupon_list[index];
      data.show_coupon_picker = false;
    }
    page.setData(data);
    page.getPrice();
  },

  getInputData: function () {
    var page = this;

    var address = page.data.address;
    var order_id = page.data.order_id;
    var contact_name = page.data.name;
    var mobile = page.data.mobile;
    var contact_address = page.data.address;

    var pay_price = page.data.order.price;
    var data = {
      address: page.data.address,
 
      contact_name: page.data.name,
      mobile: page.data.mobile,
      contact_address: page.data.address,
      picker_coupon: page.data.picker_coupon,
      pay_price:pay_price,

    }
    wx.setStorageSync('input_data', data);
  },


  loadData: function(e) {

    var page = this;
    var order_id = page.data.order_id;

    app.request({
      url: api.requirement.order_detail,
      data: {
        order_id: order_id,
      },
      success: function(e) {
        console.log(e);
        page.setData({
          order: e.data,
          pay_price:e.data.price,
          coupon_list:e.data.coupon_list
        })
      }

    })


  },
  getPrice:function(e){
    var page=this;
    var picker_coupon = page.data.picker_coupon;
    if (picker_coupon) {//选择优惠券
      var pay_price = page.data.pay_price - picker_coupon.sub_price;
       page.setData({
         pay_price:pay_price,
         coupon_id: picker_coupon.user_coupon_id

       })
    }else{
      page.setData({
        coupon_id: 0
      })
    }

     


  },
  submit: function(e) {

    var page = this;
    var address = page.data.address;
    var order_id = page.data.order_id;

    if (!address) {
      wx.showModal({
        title: '提示',
        content: '请选择联系方式',
      })
      return;
    }


    var contact_name = page.data.name;
    var mobile = page.data.mobile;
    var contact_address = page.data.address;
    var coupon_id=page.data.coupon_id
    var pay_price = page.data.pay_price;

    app.request({
      url: api.requirement.pay_data,
      data: {
        order_id: order_id,
        contact_name: contact_name,
        contact_address: contact_address.address,
        mobile: mobile,
        pay_price: pay_price,
        coupon_id:coupon_id
      },
      success: function(res) {

        if (res.code == 0) {
          wx.requestPayment({
            timeStamp: res.data.timeStamp,
            nonceStr: res.data.nonceStr,
            package: res.data.package,
            signType: res.data.signType,
            paySign: res.data.paySign,
            success: function(e) {
              console.log("success");
              console.log(e);
            },
            fail: function(e) {
              console.log("fail");
              console.log(e);
            },
            complete: function(e) {
              if (e.errMsg == "requestPayment:fail" || e.errMsg == "requestPayment:fail cancel") { //支付失败转到待支付订单列表
                wx.showModal({
                  title: "提示",
                  content: "订单尚未支付",
                  showCancel: false,
                  confirmText: "确认",
                  success: function(res) {
                    if (res.confirm) {
                      wx.redirectTo({
                        url: "/pages/requirement/order/order?status=0",
                      });
                    }
                  }
                });
                return;
              } else {

                wx.showModal({
                  title: '提示',
                  content: '订单支付成功，请等待摄影师接单',
                  success:function(e){

                    wx.redirectTo({
                      url: "/pages/requirement/order/order?status=1",
                    });

                  }
                })

              }

            },
          });
        }
        if (res.code == 1) {
          wx.showToast({
            title: res.msg,
            image: "/images/icon-warning.png",
          });
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
    var page = this;

    var address = wx.getStorageSync('picker_address');
    if (address) {
      var is_area_city_id = page.data.is_area_city_id;
      var data = {};

      function isInArray(arr, value) {
        for (var i = 0; i < arr.length; i++) {
          if (value == arr[i]) {
            return false;
          }
        }
        return true;
      }
      if (is_area_city_id) {
        if (isInArray(is_area_city_id, address.city_id)) {
          data.is_area = 1;
        } else {
          data.is_area = 0;
        }
      }
      data.address = address;
      data.name = address.name;
      data.mobile = address.mobile;
      wx.removeStorageSync("picker_address");
      page.setData(data);

    }

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