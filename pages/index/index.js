var api = require('../../api.js');
var QQMapWX = require('../../qqmap-wx-jssdk.min.js');
var app = getApp();
var share_count = 0;
var width = 260;
var int = 1;
var interval = 0;
var page_first_init = true;
var timer = 1;
var msgHistory = '';
var fullScreen = false;



var qMap = new QQMapWX({
  key: '4HKBZ-Q2ZAO-QJUWC-SRL3B-YN4F5-NGBLO'
});
Page({
  data: {
    x: wx.getSystemInfoSync().windowWidth,
    y: wx.getSystemInfoSync().windowHeight,
    left: 0,
    show_notice: false,
    animationData: {},
    play: -1,
    time: 0,
    buy_user: '',
    buy_address: '',
    buy_time: 0,
    buy_type: '',
    mylocation: '获取中...',
    m_lat: '',
    m_lon: '',
    near_list: [],
    page: 1,
    no_more: false,
    loading: false,
    unread_count: 0,
    show_msg: true,
    photographer_img: '/images/photo.png',
    user_img: '/images/user.png',
    markers: []
  },
  user: function(e) {
    wx.navigateTo({
      url: '/pages/user/user',
    })
  },
  msg: function(e) {
    wx.navigateTo({
      url: '/message/index/index',
    })

  },

  chooseStatus: function(e) {
    var id = e.currentTarget.dataset.status;
    var page=this;
    if (id == 1) {
       app.request({
             url:api.photographer.my_info,
             success:function(e){

                    if(e.code==1){
                      wx.showModal({
                        title: '提示',
                        content: e.msg,
                        success: function (e) {
                          if (e.confirm) {
                            wx.navigateTo({
                              url: '/pages/photographer/apply/apply',
                            })
                          } else {

                          }
                        }
                      })
                    }else{
                      if(e.data.status==0){
                        wx.showModal({
                          title: '提示',
                          content: '申请资料提交成功，请等待审核',
                        })
                      }else{
                        wx.reLaunch({
                          url: '/pages/photographer/index',
                        })

                      }
                    }


             }
           })
    } else {
      wx.reLaunch({
        url: '/pages/user/index',
      })
    }
  },

  hideLocation: function(e) {
    app.request({
      url: api.photographer.hide_location,
      data: {
        hide: 1
      },
      success: function(e) {
        if (e.code == 0) {
          wx.showModal({
            title: '提示',
            content: e.msg,
            success: function(e) {
              wx.reLaunch({
                url: '/pages/index/index',
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
  showLocation: function(e) {
    app.request({
      url: api.photographer.hide_location,
      data: {
        hide: 0
      },
      success: function(e) {
        if (e.code == 0) {
          wx.showModal({
            title: '提示',
            content: e.msg,
            success: function(e) {
              wx.reLaunch({
                url: '/pages/index/index',
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
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    app.pageOnLoad(this);

    var page = this;

    var parent_id = 0;
    var user_id = options.user_id;
    var scene = decodeURIComponent(options.scene);
    if (user_id != undefined) {
      parent_id = user_id;
    } else if (scene != undefined) {
      parent_id = scene;
    }
    app.loginBindParent({
      parent_id: parent_id
    });

    page.user_status();

  },
  addRequirement: function(e) {
    wx.navigateTo({
      url: "/pages/requirement/make/make"
    })
  },

  user_status: function(e) {
    var page = this;
    app.request({
      url: api.user.index,
      success: function(res) {
        if (res.code == 0) {
          page.setData(res.data);
          wx.setStorageSync('pages_user_user', res.data);
          wx.setStorageSync("share_setting", res.data.share_setting);
          wx.setStorageSync("user_info", res.data.user_info);


          page.loadData();

        }
      }
    });
  },



  areaPhotographer: function(e) {
    var page = this;
    var lat = page.data.m_lat;
    var lon = page.data.m_lon;

    //查找摄影师
    app.request({
      url: api.photographer.area_list,
      data: {
        u_lat: lat,
        u_lon: lon,

      },
      success: function(e) {
        console.log(e);
        var markers = page.data.markers;
        var list = e.data.list;
        for (let i in list) {
          var item = list[i];

          var marker = {
            id: item.id,
            latitude: item.lat,
            longitude: item.lon,
            title: item.name,
            iconPath: page.data.photographer_img,
            width: 40,
            height: 40,

          }
          markers.push(marker);

        }

        page.setData({

          markers: markers
        })

      }
    })

  },

  areaOrder: function(e) {
    var page = this;
    var lat = page.data.m_lat;
    var lon = page.data.m_lon;

    //查找摄影师
    app.request({
      url: api.requirement.area_order,
      data: {
        u_lat: lat,
        u_lon: lon,
      },
      success: function(e) {
        console.log(e);
        var markers = page.data.markers;
        var list = e.data.list;
        for (let i in list) {
          var item = list[i];
          var marker = {
            id: item.id,
            latitude: item.lat,
            longitude: item.lon,
            title: item.name,
            iconPath: page.data.user_img,
            width: 40,
            height: 40,

          }
          markers.push(marker);
        }

        page.setData({

          markers: markers
        })

      }
    })

  },




  /**
   * 加载页面数据
   */
  loadData: function(options) {
    var page = this;
    var pages_index_index = wx.getStorageSync('pages_index_index');
    if (pages_index_index) {
      pages_index_index.act_modal_list = [];
      page.setData(pages_index_index);
    }




    wx.getLocation({
      success: function(res) {
        console.log(res);
        console.log("+++++++++++++++++")
        page.setData({
          openSetting: false,
          m_lat: res.latitude,
          m_lon: res.longitude,
        })

        wx.setStorageSync('m_lat', res.latitude);
        wx.setStorageSync('m_lon', res.longitude);


        wx.showLoading({
          title: '加载中',
        })
        qMap.reverseGeocoder({
          location: {
            latitude: res.latitude,
            longitude: res.longitude
          },
          success: function(res) {
            console.log(res);
          },
          fail: function(res) {
            console.log(res);
          },
          complete: function(res) {



            page.setData({
              mylocation: res.result.address_component.city
            })
            wx.setStorageSync('mylocation', res.result.address_component.city)

          }
        });



        wx.hideLoading();
      },
    })


    wx.getLocation({
      success: function(res) {
        page.setData({
          openSetting: false,
          m_lat: res.latitude,
          m_lon: res.longitude
        })


        var marker = {
          id: 0,
          latitude: res.latitude,
          longitude: res.longitude,

          iconPath: '/images/myloaction.png',
          width: 40,
          height: 40,

        }

        var markers = page.data.markers;
        markers.push(marker);
        page.setData({
          markers: markers
        })


        qMap.reverseGeocoder({
          location: {
            latitude: res.latitude,
            longitude: res.longitude
          },
          success: function(res) {},
          fail: function(res) {},
          complete: function(res) {
            var is_phohographer = page.data.user_info.is_photographer;
            if (is_phohographer == 1) {
              page.areaOrder();
              app.request({
                url: api.photographer.update_location,
                data: {
                  lat: page.data.m_lat,
                  lon: page.data.m_lon,
                  address: res.result.address
                },
                success: function(e) {
                  console.log(e);
                }
              })
            } else {
              page.areaPhotographer();
            }
            page.setData({
              mylocation: res.result.address_component.city
            })
            wx.setStorageSync('mylocation', res.result.address_component.city)
          }
        });
      },
      fail: function(e) {

        page.setData({
          openSetting: true
        })
      }
    })

  },
  refresh: function(e) {

    this.loadData();
  },
  openSetting: function(e) {

    if (e.detail.authSetting["scope.userLocation"]) { //如果打开了地理位置，就会为true
      wx.reLaunch({
        url: '/pages/index/index',
      })
    } else {
      wx.reLaunch({
        url: '/pages/index/index',
      })
    }
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    app.pageOnShow(this);
    share_count = 0;
    var store = wx.getStorageSync("store");
    var page = this;
    if (store && store.name) {
      wx.setNavigationBarTitle({
        title: store.name,
      });
    }
    if (store.purchase_frame === 1) {
      this.suspension(this.data.time);
    } else {
      this.setData({
        buy_user: '',
      })
    };
    clearInterval(int);
    this.notice();




    var chat_list = wx.getStorageSync('chat_list');

    if (chat_list != '') {
      page.setData({
        chat_list: chat_list
      })
    }
  },

  read: function(e) {
    var page = this;
    page.setData({
      unread_count: 0
    })

  },

  //获取未读消息

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {
    clearInterval(timer);
    this.user_status();
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function(options) {
    var page = this;
    var user_info = wx.getStorageSync("user_info");
    return {
      path: "/pages/index/index?user_id=" + user_info.id,
      success: function(e) {
        share_count++;
        if (share_count == 1)
          app.shareSendCoupon(page);
      },
      title: page.data.store.name
    };
  },
  receive: function(e) {
    var page = this;
    var id = e.currentTarget.dataset.index;
    wx.showLoading({
      title: '领取中',
      mask: true,
    })
    if (!page.hideGetCoupon) {
      page.hideGetCoupon = function(e) {
        var url = e.currentTarget.dataset.url || false;
        page.setData({
          get_coupon_list: null,
        });
        if (url) {
          wx.navigateTo({
            url: url,
          });
        }
      };
    }
    app.request({
      url: api.coupon.receive,
      data: {
        id: id
      },
      success: function(res) {
        wx.hideLoading();
        if (res.code == 0) {
          page.setData({
            get_coupon_list: res.data.list,
            coupon_list: res.data.coupon_list
          });
        } else {
          wx.showToast({
            title: res.msg,
            duration: 2000
          })
          page.setData({
            coupon_list: res.data.coupon_list
          });
        }
      },
      // complete: function () {
      //   wx.hideLoading();
      // }
    });
  },

  navigatorClick: function(e) {
    var page = this;
    var open_type = e.currentTarget.dataset.open_type;
    var url = e.currentTarget.dataset.url;
    if (open_type != 'wxapp')
      return true;
    //console.log(url);
    url = parseQueryString(url);
    url.path = url.path ? decodeURIComponent(url.path) : "";
    console.log("Open New App");
    wx.navigateToMiniProgram({
      appId: url.appId,
      path: url.path,
      complete: function(e) {
        console.log(e);
      }
    });
    return false;

    function parseQueryString(url) {
      var reg_url = /^[^\?]+\?([\w\W]+)$/,
        reg_para = /([^&=]+)=([\w\W]*?)(&|$|#)/g,
        arr_url = reg_url.exec(url),
        ret = {};
      if (arr_url && arr_url[1]) {
        var str_para = arr_url[1],
          result;
        while ((result = reg_para.exec(str_para)) != null) {
          ret[result[1]] = result[2];
        }
      }
      return ret;
    }
  },
  closeCouponBox: function(e) {
    this.setData({
      get_coupon_list: ""
    });
  },

  notice: function() {
    var page = this;
    var notice = page.data.notice;
    if (notice == undefined) {
      return;
    }
    var length = notice.length * 14;
    return;
  },
  miaoshaTimer: function() {
    var page = this;
    if (!page.data.miaosha || !page.data.miaosha.rest_time)
      return;
    timer = setInterval(function() {
      if (page.data.miaosha.rest_time > 0) {
        page.data.miaosha.rest_time = page.data.miaosha.rest_time - 1;
      } else {
        clearInterval(timer);
        return;
      }
      page.data.miaosha.times = page.getTimesBySecond(page.data.miaosha.rest_time);
      page.setData({
        miaosha: page.data.miaosha,
      });
    }, 1000);

  },

  chat: function(e) {

    var url = "/im/index/index";
    wx.switchTab({
      url: url,
    })
  },
  onHide: function() {
    app.pageOnHide(this);


    this.setData({
      play: -1
    });
    clearInterval(int);
    clearInterval(interval);
    console.log('hide')
  },
  onUnload: function() {
    app.pageOnUnload(this);
    this.setData({
      play: -1
    });
    clearInterval(timer);
    clearInterval(int);
    clearInterval(interval);
    console.log('unload')


  },
  showNotice: function() {
    this.setData({
      show_notice: true
    });
  },
  closeNotice: function() {
    this.setData({
      show_notice: false
    });
  },

  getTimesBySecond: function(s) {
    s = parseInt(s);
    if (isNaN(s))
      return {
        h: '00',
        m: '00',
        s: '00',
      };
    var _h = parseInt(s / 3600);
    var _m = parseInt((s % 3600) / 60);
    var _s = s % 60;
    var type = 0;
    if (_h >= 1) {
      _h -= 1;
    }
    return {
      h: _h < 10 ? ('0' + _h) : ('' + _h),
      m: _m < 10 ? ('0' + _m) : ('' + _m),
      s: _s < 10 ? ('0' + _s) : ('' + _s),
    };

  },
  to_dial: function() {
    var contact_tel = this.data.store.contact_tel;
    wx.makePhoneCall({
      phoneNumber: contact_tel
    })
  },

  closeActModal: function() {
    var page = this;
    var act_modal_list = page.data.act_modal_list;
    var show_next = true;
    var next_i;
    for (var i in act_modal_list) {
      var index = parseInt(i);
      if (act_modal_list[index].show) {
        act_modal_list[index].show = false;
        next_i = index + 1;
        if (typeof act_modal_list[next_i] != 'undefined' && show_next) {
          show_next = false;
          setTimeout(function() {
            page.data.act_modal_list[next_i].show = true;
            page.setData({
              act_modal_list: page.data.act_modal_list
            });
          }, 500);
        }
      }
    }
    page.setData({
      act_modal_list: act_modal_list,
    });
  },
  naveClick: function(e) {
    var page = this;
    app.navigatorClick(e, page);
  },
  play: function(e) {
    this.setData({
      play: e.currentTarget.dataset.index
    });
  },
  onPageScroll: function(e) {
    var page = this;
    if (fullScreen) {
      return;
    }
    if (page.data.play != -1) {
      wx.createSelectorQuery().select('.video').fields({
        rect: true
      }, function(res) {
        var max = wx.getSystemInfoSync().windowHeight;
        if (res.top <= -200 || res.top >= max - 57) {
          page.setData({
            play: -1
          });
        }
      }).exec();
    }
  },
  fullscreenchange: function(e) {
    if (e.detail.fullScreen) {
      fullScreen = true;
    } else {
      fullScreen = false;
    }
  },
  onReachBottom: function() {
    var page = this;

  },
  onReady: function() {

  },



});