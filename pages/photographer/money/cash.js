// pages/cash/cash.js
var api = require('../../../api.js');
var app = getApp();

function min(var1, var2) {
  var1 = parseFloat(var1);
  var2 = parseFloat(var2);
  return var1 > var2 ? var2 : var1;
}

Page({

  /**
   * 页面的初始数据
   */
  data: {
    price: 0.00,
    cash_max_day: -1,
    selected: -1
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    app.pageOnLoad(this);
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
    var page = this;
    var share_setting = wx.getStorageSync("share_setting");
    var custom = wx.getStorageSync("custom");
    page.setData({
      share_setting: share_setting,
      custom: custom
    });
    app.request({
      url: api.user.get_price,
      success: function (res) {
        if (res.code == 0) {
          var cash_last = res.data.cash_last;
          page.setData({
            price: res.data.price,
            rate:res.data.rate,
            pay_type: res.data.pay_type,
            remaining_sum: res.data.remaining_sum,

          });
        }
      }
    });
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },
  formSubmit: function (e) {
    var page = this;
    var cash = parseFloat(parseFloat(e.detail.value.cash).toFixed(2));
    var cash_max = page.data.price;
    var name = e.detail.value.name;
    console.log(e);



    if (!name || name == undefined) {
      wx.showToast({
        title: '姓名不能为空',
        image: "/images/icon-warning.png",
      });
      return;
    }
    var mobile = e.detail.value.mobile;
    if (!mobile || mobile == undefined) {
      wx.showToast({
        title: '账号不能为空',
        image: "/images/icon-warning.png",
      });
      return;
    }
    if (!cash) {
      wx.showToast({
        title: "请输入提现金额",
        image: "/images/icon-warning.png",
      });
      return;
    }
    if (cash > cash_max) {
      wx.showToast({
        title: "提现金额不能超过" + cash_max + "元",
        image: "/images/icon-warning.png",
      });
      return;
    }
    if (cash < parseFloat(page.data.share_setting.min_money)) {
      wx.showToast({
        title: "提现金额不能低于" + page.data.share_setting.min_money + "元",
        image: "/images/icon-warning.png",
      });
      return;
    }
    wx.showLoading({
      title: "正在提交",
      mask: true,
    });
    app.request({
      url: api.user.apply,
      method: 'POST',
      data: {
        name: name,
        mobile: mobile,
        cash: cash,
        scene: 'CASH',
        form_id: e.detail.formId,
      },
      success: function (res) {
        wx.hideLoading();
        wx.showModal({
          title: "提示",
          content: res.msg,
          showCancel: false,
          success: function (e) {
            if (e.confirm) {
              if (res.code == 0) {
                wx.redirectTo({
                  url: '/pages/photographer/money/cash-detail',
                })
              }
            }
          }
        });
      }
    });
  },

  showCashMaxDetail: function () {
    wx.showModal({
      title: "提示",
      content: "今日剩余提现金额=平台每日可提现金额-今日所有用户提现金额"
    });
  },
  select: function (e) {
    var index = e.currentTarget.dataset.index;
    var check = this.data.check;
    if (index != check) {
      this.setData({
        name: '',
        mobile: '',
        bank_name: '',
      });
    }
    this.setData({
      selected: index
    });
  }

});