// order.js
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
    order_list: [],
    show_no_data_tip: false,
    hide: 1,
    qrcode: ""
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    app.pageOnLoad(this);
    var page = this;
    is_no_more = false;
    is_loading = false;
    p = 2;
    page.loadOrderList(options.status || -1);
    var pages = getCurrentPages();
    if (pages.length < 2) {
      page.setData({
        show_index: true,
      });
    }
  },


  addPrice: function(e) {
    var page = this;
    var reward_id = e.currentTarget.dataset.reward_id;

    app.request({
      url: api.requirement.add_price,
      data: {
        order_id: reward_id
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
                        url: "/pages/requirement/order/order?status=2",
                      });
                    }
                  }
                });
                return;
              } else {

                wx.showModal({
                  title: '提示',
                  content: '订单支付成功',
                  success: function(e) {

                    wx.redirectTo({
                      url: "/pages/requirement/order/order?status=2",
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

  loadOrderList: function(status) {
    if (status == undefined)
      status = -1;
    var page = this;
    page.setData({
      status: status,
    });
    wx.showLoading({
      title: "正在加载",
      mask: true,
    });
    app.request({
      url: api.requirement.order_list,
      data: {
        status: page.data.status,
      },
      success: function(res) {
        if (res.code == 0) {
          page.setData({
            order_list: res.data.list,
            pay_type_list: res.data.pay_type_list
          });
          var item = wx.getStorageSync('item');
          if (item) {
            wx.removeStorageSync('item');
          }

        }
        page.setData({
          show_no_data_tip: (page.data.order_list.length == 0),
        });
      },
      complete: function() {
        wx.hideLoading();
      }
    });
  },

  download: function(e) {
    var order_id = e.currentTarget.dataset.id;
    var type = e.currentTarget.dataset.type;
    var page = this;
    wx.getSetting({
      success(res) {
        if (!res.authSetting['scope.writePhotosAlbum']) {
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success() {
              console.log('授权成功')
            }
          })
        }
      }
    })

    app.request({
      url: api.requirement.download,
      data: {
        order_id: order_id,
        type:type

      },
      success: function(e) {
        console.log(e);
        var size = e.data.length
        if (size > 0) {
          wx.showLoading({
            title: '下载中...',
          })
          for (let i in e.data) {
            let url = e.data[i].url;
            const downTask = wx.downloadFile({
              url: url,
              success: function(e) {
                wx.saveImageToPhotosAlbum({
                  filePath: e.tempFilePath,
                  success: function (data) {
                    console.log(data);
                  },
                  fail: function (err) {
                    console.log(err);
                    if (err.errMsg === "saveImageToPhotosAlbum:fail auth deny") {
                      console.log("用户一开始拒绝了，我们想再次发起授权")
                      console.log('打开设置窗口')
                      wx.openSetting({
                        success(settingdata) {
                          console.log(settingdata)
                          if (settingdata.authSetting['scope.writePhotosAlbum']) {
                            console.log('获取权限成功，给出再次点击图片保存到相册的提示。')
                          } else {
                            console.log('获取权限失败，给出不给权限就无法正常使用的提示')
                          }
                        }
                      })
                    }
                  }
                })
                if (i == size - 1) {
                  wx.hideLoading();
                  wx.showToast({
                    title: '下载完成',
                  })
                }
              }
            })
          }
        }
      }
    })
  },



  onReachBottom: function() {
    var page = this;
    if (is_loading || is_no_more)
      return;
    is_loading = true;
    app.request({
      url: api.order.list,
      data: {
        status: page.data.status,
        page: p,
      },
      success: function(res) {
        if (res.code == 0) {

          var order_list = page.data.order_list.concat(res.data.list);
          page.setData({
            order_list: order_list,
            pay_type_list: res.data.pay_type_list
          });
          if (res.data.list.length == 0) {
            is_no_more = true;
          }
        }
        p++;
      },
      complete: function() {
        is_loading = false;
      }
    });
  },


  order_pay: function(e) {
    var page = this;
    page.WechatPay(e);
  },

  WechatPay: function(e) {
    var page = this;
    var order = page.data.order_list[e.currentTarget.dataset.index];
    app.request({
      url: api.requirement.pay_data,
      data: {
        order_id: order.id,
        contact_name: order.contact_name,
        contact_address: order.contact_address,
        mobile: order.mobile,
        pay_price: order.pay_price
      },
      complete: function() {
        wx.hideLoading();
      },
      success: function(res) {
        console.log(res);
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
              }
              wx.redirectTo({
                url: "/pages/requirement/order/order?status=1",
              });
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
    });
  },

  BalancePay: function(e) {

    app.request({
      url: api.order.pay_data,
      data: {
        order_id: e.currentTarget.dataset.id,
        pay_type: "BALANCE_PAY",
      },
      complete: function() {
        wx.hideLoading();
      },
      success: function(res) {
        if (res.code == 0) {
          wx.redirectTo({
            url: "/pages/order/order?status=1",
          });
        }
        if (res.code == 1) {
          wx.showModal({
            title: '提示',
            content: res.msg,
            showCancel: false
          })
        }
      }
    });
  },

  orderRevoke: function(e) {
    var page = this;
    wx.showModal({
      title: "提示",
      content: "是否取消该订单？",
      cancelText: "否",
      confirmText: "是",
      success: function(res) {
        if (res.cancel)
          return true;
        if (res.confirm) {
          wx.showLoading({
            title: "操作中",
          });
          app.request({
            url: api.order.revoke,
            data: {
              order_id: e.currentTarget.dataset.id,
            },
            success: function(res) {
              wx.hideLoading();
              wx.showModal({
                title: "提示",
                content: res.msg,
                showCancel: false,
                success: function(res) {
                  if (res.confirm) {
                    page.loadOrderList(page.data.status);
                  }
                }
              });
            }
          });
        }
      }
    });
  },

  orderConfirm: function(e) {
    var page = this;
    wx.showModal({
      title: "提示",
      content: "确认完成后将会打款给该摄影师？",
      cancelText: "否",
      confirmText: "是",
      success: function(res) {
        if (res.cancel)
          return true;
        if (res.confirm) {
          wx.showLoading({
            title: "操作中",
          });
          app.request({
            url: api.requirement.confirm,
            data: {
              order_id: e.currentTarget.dataset.id,
            },
            success: function(res) {

              wx.showToast({
                title: res.msg,
              });
              if (res.code == 0) {
                page.loadOrderList(3);
              }
            }
          });
        }
      }
    });
  },
  orderQrcode: function(e) {
    var page = this;
    var order_list = page.data.order_list;
    var index = e.target.dataset.index;
    wx.showLoading({
      title: "正在加载",
      mask: true,
    });
    if (page.data.order_list[index].offline_qrcode) {
      page.setData({
        hide: 0,
        qrcode: page.data.order_list[index].offline_qrcode
      });
      wx.hideLoading();
    } else {
      app.request({
        url: api.order.get_qrcode,
        data: {
          order_no: order_list[index].order_no
        },
        success: function(res) {
          if (res.code == 0) {
            page.setData({
              hide: 0,
              qrcode: res.data.url
            });
          } else {
            wx.showModal({
              title: '提示',
              content: res.msg,
            })
          }
        },
        complete: function() {
          wx.hideLoading();
        }
      });
    }
  },
  hide: function(e) {
    this.setData({
      hide: 1
    });
  },
  onShow: function() {
    app.pageOnShow(this);
  }

});