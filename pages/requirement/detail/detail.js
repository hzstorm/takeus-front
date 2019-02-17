// pages/requirement/submit/submit.js

// pages/requirement/make/make.js
var api = require('../../../api.js');
var app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    label_list: [],
    order_number: 1,
   /* attr_group_list: [
      [{
        attr_group_name: '规格',
        attr_list: [{
          checked: true,
          attr_group_id: 1,
          attr_name: '大镜头'
        }]
      }]
    ]*/
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    var page = this;

    console.log(options);

    var p_id = options.id;
    page.setData({
      p_id: p_id
    })

    var option = wx.getStorageSync('m_option');

    page.setData(option);



    page.loadPhotographerInfo();

    page.getPrice();

  },

  numberSub: function() {
    var page = this;
    var num = page.data.order_number;
    if (num <= 1)
      return true;
    num--;
    var minutes = page.data.minutes;
    var number = page.data.number;





    var minutes_cur = page.data.minutes * num;
    var number_cur = page.data.number * num;


    var price_cur = page.data.price * num;
    page.setData({
      order_number: num,
      minutes_cur: minutes_cur,
      number_cur: number_cur,
      price_cur: price_cur
    });
  },
  numberAdd: function() {
    var page = this;
    var num = page.data.order_number;
    num++;
    var minutes_cur = page.data.minutes * num;
    var number_cur = page.data.number * num;
    var price_cur = page.data.price * num;
    page.setData({
      order_number: num,
      minutes_cur: minutes_cur,
      number_cur: number_cur,
      price_cur: price_cur



    });
  },

  numberBlur: function(e) {
    var page = this;
    var num = e.detail.value;
    num = parseInt(num);
    if (isNaN(num))
      num = 1;
    if (num <= 0)
      num = 1;
    var minutes_cur = page.data.minutes * num;
    var number_cur = page.data.number * num;



    var price_cur = page.data.price * num;
    page.setData({
      order_number: num,
      minutes_cur: minutes_cur,
      number_cur: number_cur,
      price_cur: price_cur



    });
  },


  hideAttrPicker: function() {
    var page = this;
    page.setData({
      show_attr_picker: false,
    });
  },
  showAttrPicker: function() {
    var page = this;
    page.setData({
      show_attr_picker: true,
    });
  },

  attrClick: function(e) {
    var page = this;
    var attr_group_id = e.target.dataset.groupId;
    var attr_id = e.target.dataset.id;
    var attr_group_list = page.data.attr_group_list;
    for (var i in attr_group_list) {
      if (attr_group_list[i].attr_group_id != attr_group_id)
        continue;
      for (var j in attr_group_list[i].attr_list) {
        if (attr_group_list[i].attr_list[j].attr_id == attr_id) {
          attr_group_list[i].attr_list[j].checked = true;
        } else {
          attr_group_list[i].attr_list[j].checked = false;
        }
      }
    }
    page.setData({
      attr_group_list: attr_group_list,
    });
    var check_attr_list = [];
    var check_all = true;
    for (var i in attr_group_list) {
      var group_checked = false;
      for (var j in attr_group_list[i].attr_list) {
        if (attr_group_list[i].attr_list[j].checked) {
          check_attr_list.push(attr_group_list[i].attr_list[j].attr_id);
          group_checked = true;
          break;
        }
      }
      if (!group_checked) {
        check_all = false;
        break;
      }
    }
    var carGoods = page.data.carGoods;
    if (carGoods) {
      var length = carGoods.length;
      var item = [];
      for (var i = 0; i < length; i++) {
        if (carGoods[i].goods_id == page.data.goods.id) {
          var attr = carGoods[i].attr;
        }
        if (attr) {
          var attr_length = attr.length;
          var item = [];
          for (var x = 0; x < attr_length; x++) {
            item.push(attr[x].attr_id)
          }
          var check_num = 0;
          if (check_attr_list.join(',') == item.join(',')) {
            check_num = carGoods[i].num;
            break;
          }
        } else {
          var check_num = 0;
        }
      }
      page.setData({
        check_num: check_num || null,
      });
    }



    if (!check_all)
      return;
    // wx.showLoading({
    //     title: "正在加载",
    //     mask: true,
    // });
    app.request({
      url: api.default.goods_attr_info,
      data: {
        goods_id: page.data.goods.id,
        attr_list: JSON.stringify(check_attr_list),
      },
      success: function(res) {
        // wx.hideLoading();
        if (res.code == 0) {
          var goods = page.data.goods;
          goods.price = res.data.price;
          goods.num = res.data.num;
          goods.attr_pic = res.data.pic;
          page.setData({
            goods: goods,
            miaosha_data: res.data.miaosha,
          });
        }
      }
    });

  },


  submit: function(e) {
    var page = this;

    if (!page.data.show_attr_picker) {
      page.setData({
        show_attr_picker: true,
      });
      return true;
    }
    var p_id = page.data.p_id;
    var form_id = e.detail.formId;
    var type_id = page.data.type_id;
    var time = page.data.time;
    var date = page.data.date;
    var datetime = date + ' ' + time;
    var level_id = page.data.level_id;
    var price = page.data.price_cur;
    var address = page.data.address;
    var taocan_id = page.data.taocan_id
    var amount = page.data.order_number;
    app.request({
      url: api.requirement.submit_order,
      data: {
        requirement_id: type_id,
        datetime: datetime,
        level_id: level_id,
        price: price,
        photographer_id: p_id,
        address: address,
        lat: page.data.lat,
        lon: page.data.lon,
        form_id: form_id,
        taocan_id: taocan_id,
        amount: amount
      },
      success: function(e) {
        console.log(e)
        if (e.code == 0) {

          wx.navigateTo({
            url: '../submit/submit?order_id=' + e.order_id,
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

  getPrice: function(e) {
    var page = this;

    var level_id = page.data.level_id;
    var type_id = page.data.type_id;
    app.request({
      url: api.requirement.get_price,
      data: {
        level_id: level_id,
        type_id: type_id,
      },
      success: function(e) {
        console.log(e)
        if (e.code == 0) {
          page.setData({
            price: e.data.price,
            minutes: e.data.minutes,
            number: e.data.number,
            minutes_cur: e.data.minutes,
            number_cur: e.data.number,
            price_cur: e.data.price,
            taocan_id: e.data.id

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
    var p_id = page.data.p_id;
    var m_lat = wx.getStorageSync('m_lat');
    var m_lon = wx.getStorageSync('m_lon');

    app.request({
      url: api.photographer.info,
      data: {
        p_id: p_id,
        m_lat: m_lat,
        m_lon: m_lon
      },
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
  buyNow: function() {
    var userInfo = wx.getStorageSync('user_info');
    this.submit('BUY_NOW');
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