// pages/photograper/apply/apply.js
var api = require('../../../api.js');
var QQMapWX = require('../../../qqmap-wx-jssdk.min.js');
var utils = require('../../../utils.js');
var app = getApp();

var qMap = new QQMapWX({
  key: '4HKBZ-Q2ZAO-QJUWC-SRL3B-YN4F5-NGBLO'
});
Page({

  /**
   * 页面的初始数据
   */
  data: {
    index: 0,
    sex: 0,
    id_card:null,
    levels: [{
      id: 1,
      name: "金牌摄影师"
    }],
    header_url: '',
    product_list:[]
  },

  bindLevelPicker: function(e) {
    console.log(e);
    var index = e.detail.value;
    var page = this;
    var level_list = page.data.level_list;

    page.setData({
      index: index,
      level_id: level_list[index].id
    })
  },
  uploadImg: function(e) {
    var page = this;
    var index = e.currentTarget.dataset.index;
    var form = page.data.form;
    app.uploader.upload({
      start: function() {
        wx.showLoading({
          title: '正在上传',
          mask: true,
        });
      },
      success: function(res) {
        if (res.code == 0) {
          page.setData({
            header_url: res.data.url,
          });
        } else {
          page.showToast({
            title: res.msg,
          });
        }
      },
      error: function(e) {
      
        page.showToast({
          title: e,
        });
      },
      complete: function() {
        wx.hideLoading();
      }
    })
  },
   uploadIdCard:function(e){

    var page=this;
    app.uploader.upload({
      start: function () {
        wx.showLoading({
          title: '正在上传',
          mask: true,
        });
      },
      success: function (res) {
        if (res.code == 0) {
          page.setData({
            id_card: res.data.url,
          });
        } else {
          page.showToast({
            title: res.msg,
          });
        }
      },
      error: function (e) {
        console.log(e);
        page.showToast({
          title: e,
        });
      },
      complete: function () {
        wx.hideLoading();
      }
    })


   },


  radioChange: function(e) {

    console.log(e);
    var page = this;
    page.setData({
      sex: e.detail.value
    })





  },


  uploadProImg: function (e) {
    var page = this;
    
    var product_list = page.data.product_list;
    var count=9-product_list.length;


    app.uploader.uploadProducts({
      start: function () {
        wx.showLoading({
          title: '正在上传',
          mask: true,
        });
      },
      success: function (res) {
        if (res.code == 0) {

          product_list.push(res.data.url);

          page.setData({
            product_list: product_list,
          });
        } else {
          page.showToast({
            title: res.msg,
          });
        }
      },
      error: function (e) {

        page.showToast({
          title: e,
        });
      },
      complete: function () {
        wx.hideLoading();
      }
    },count)
  },


  submit: function(e) {

    console.log(e)
    var page = this;

    var name = e.detail.value.name;
    var mobile = e.detail.value.mobile;
    var details = e.detail.value.details;
    var header_url = page.data.header_url;
    var level_id = page.data.level_id;

    var lat = page.data.lat;
    var lon = page.data.lon;
    var address = page.data.address;
    var sex = page.data.sex;
    var id_card=page.data.id_card


    if (page.data.product_list.length==0){


          wx.showModal({
            title: '提示',
            content: '请上传您的作品！',

          })
          return;
          
    }
    var product_list = JSON.stringify(page.data.product_list);
    var content='';
    if(!mobile){
      content="手机号码不能为空";
    }else if(!name){
      content = "姓名不能为空";
    }
    else if (!name) {
      content = "姓名不能为空";
    } else if (!details) {
      content = "简介不能为空";
    } else if (!header_url) {
      content = "头像不能为空";
    }
    else if (!id_card) {
      content = "身份证不能为空";
    }


if(content!=''){
  wx.showModal({
    title: '提示',
    content: content,
  })
  return;
}

    app.request({
      url: api.photographer.apply,
      method: "POST",
      data: {
        name: name,
        header_url: header_url,
        level_id: level_id,
        details: details,
        lat: lat,
        lon: lon,
        address: address,
        sex: sex,
        id_card:id_card,
        mobile:mobile,
        product_list:product_list
      },
      success: function(e) {
        console.log(e)
        if (e.code == 0) {
          wx.showToast({
            title: e.msg,
            success: function(e) {
                 wx.showModal({
                   title: '提示',
                   content: '申请资料提交成功，请等待审核',
                   success:function(e){
                     wx.reLaunch({
                       url: '/pages/index/index',
                     })
                   }
                 })
            }
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
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    var page = this;

    app.request({
      url: api.photographer.level_list,
      data: {},
      success: function(e) {
        console.log(e)

      if(e.code==0){
        if(e.data.length>0){
          page.setData({
            level_list: e.data,
            level_id: e.data[0].id
          })
        }else{
          wx.showToast({
            title: '系统还未设置',
          })
          wx.navigateBack({
            delta:1
          })
        }
      }

      }
    });

    wx.getLocation({
      success: function(res) {
        console.log(res)
        page.setData({
          lat: res.latitude,
          lon: res.longitude
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
            console.log(res);

            page.setData({
              address: res.result.address
            })


          }
        });

      },
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