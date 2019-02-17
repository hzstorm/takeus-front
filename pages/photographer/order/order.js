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
    qrcode: "",
    show: false,
    add_price: 0
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
    page.setData({
      show: true
    })
    console.log(e);

    page.setData({
      add_id: e.currentTarget.dataset.id
    })



  },
  priceInput: function(e) {
    var page = this;
    page.setData({
      add_price: e.detail.value
    })
    console.log(e);

  },
  addSubmit: function(e) {
    var page = this;
    var add_price = page.data.add_price;
    var order_id = page.data.add_id;
    if (add_price == 0) {
      wx.showModal({
        title: '提示',
        content: '增减金额不能为空',
      })
      return;

    }
    app.request({
      url: api.photographer.add_price,
      data: {
        order_id: order_id,
        price: add_price,
      },
      success: function(e) {
        console.log(e);
        if (e.code == 0) {
          wx.redirectTo({
            url: "/pages/photographer/order/order?status=2",
          });
          wx.showToast({
            title: e.msg,
          })
        } else {
          page.setData({
            show: false
          })
          wx.showToast({
            title: e.msg,
            image: "/images/icon-warning.png",
          })
        }



      }

    })






  },

  closeActModal: function(e) {
    var page = this;
    console.log(e);

    page.setData({
      show: false,
      add_id: 0
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
        is_photographer: 1
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
  access_order: function(e) {
    var page = this;
    var order_id = e.currentTarget.dataset.id

    app.request({
      url: api.photographer.access_order,
      data: {
        order_id: order_id
      },
      success: function(e) {
        if (e.code == 0) {
          wx.showModal({
            title: '提示',
            content: e.msg,
            success: function(e) {
              wx.redirectTo({
                url: '/pages/photographer/order/order?status=1',
              })
            }
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




  onReachBottom: function() {
    var page = this;
    if (is_loading || is_no_more)
      return;
    is_loading = true;
    app.request({
      url: api.requirement.order_list,
      data: {
        status: page.data.status,
        page: p,
        is_photographer: 1
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
                        url: "/pages/photographer/order/order?status=0",
                      });
                    }
                  }
                });
                return;
              }
              wx.redirectTo({
                url: "/pages/photographer/order/order?status=1",
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
      content: "是否确认已收到货？",
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
            url: api.order.confirm,
            data: {
              order_id: e.currentTarget.dataset.id,
            },
            success: function(res) {
              wx.hideLoading();
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
  },

  uploadImg: function(e) {


    var page = this;
    var order_id = e.currentTarget.dataset.id;
    var pic_list = [];
    app.uploader.uploadMore({
      data: {
        order_id: order_id
      },
      start: function() {
        wx.showLoading({
          title: '正在上传',
          mask: true,
        });
      },
      success: function(res) {
        if (res.code == 0) {
          var pic_url = res.data.url
          pic_list.push(pic_url);
          page.setData({
            pic_list: pic_list,
          });
        } else {
          page.showToast({
            title: res.msg,
          });
        }
      },
      error: function(e) {
        console.log(e);
        page.showToast({
          title: e,
        });
      },
      complete: function() {
        app.request({
          url:api.photographer.can_down,
          data:{
            order_id:order_id
          },
          success:function(e){
            wx.hideLoading();
            wx.redirectTo({
              url: '/pages/photographer/order/order?status=2',
            })

          }
        })
 


      
      
      }
    }, 9)
  }


});