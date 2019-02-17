// goods.js
var api = require('../../api.js');
var utils = require('../../utils.js');
var app = getApp();
var WxParse = require('../../wxParse/wxParse.js');
var p = 1;
var is_loading_comment = false;
var is_more_comment = true;
var share_count = 0;
Page({

    /**
     * 页面的初始数据
     */
    data: {
        id: null,
        goods: {},
        show_attr_picker: false,
        form: {
            number: 1,
        },
        tab_detail: "active",
        tab_comment: "",
        comment_list: [],
        comment_count: {
            score_all: 0,
            score_3: 0,
            score_2: 0,
            score_1: 0,
        },
        autoplay: false,
        hide: "hide",
        show: false,
        x: wx.getSystemInfoSync().windowWidth,
        y: wx.getSystemInfoSync().windowHeight - 20,
        miaosha_end_time_over: {
            h: "--",
            m: "--",
            s: "--",
        },
        page: 1,
        drop:false,
        goodsModel:false,
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        var page = this;
        app.pageOnLoad(this);
        console.log(wx.getSystemInfoSync());
        share_count = 0;
        p = 1;
        is_loading_comment = false;
        is_more_comment = true;
        var quick = options.quick;
        if (quick) {
            var item = wx.getStorageSync('item')
            if (item) {
                var total = item.total;
                var carGoods = item.carGoods;
            } else {
                var total = {
                    total_price: 0.00,
                    total_num: 0
                }
                var carGoods = [];
            }
            page.setData({
                quick: quick,
                quick_list: item.quick_list,
                total: total,
                carGoods: carGoods,
                quick_hot_goods_lists: item.quick_hot_goods_lists,
            });
        }
        this.setData({
            store: wx.getStorageSync('store'),
        });
        var parent_id = 0;
        var user_id = options.user_id;
        console.log("options=>" + JSON.stringify(options));
        var scene = decodeURIComponent(options.scene);
        if (user_id != undefined) {
            parent_id = user_id;
        } else if (scene != undefined) {
            console.log("scene string=>" + scene);
            var scene_obj = utils.scene_decode(scene);
            console.log("scene obj=>" + JSON.stringify(scene_obj));
            if (scene_obj.uid && scene_obj.gid) {
                parent_id = scene_obj.uid;
                options.id = scene_obj.gid;
            } else {
                parent_id = scene;
            }
        }
        app.loginBindParent({parent_id: parent_id});
        
        page.setData({
            id: options.id,
        });
        page.getGoods();
        page.getCommentList();
    },
    getGoods: function () {
        var page = this;
        var quick = page.data.quick;
        if (quick) {
            var carGoods = page.data.carGoods;
            if (carGoods){
                var length = carGoods.length;
                var goods_num = 0;
                for (var i = 0; i < length; i++) {
                    if (carGoods[i].goods_id == page.data.id) {
                        goods_num += parseInt(carGoods[i].num);
                    }
                }
                page.setData({
                    goods_num: goods_num
                });
            }
        }
        app.request({
            url: api.default.goods,
            data: {
                id: page.data.id
            },
            success: function (res) {
                if (res.code == 0) {
                    var detail = res.data.detail;
                    WxParse.wxParse("detail", "html", detail, page);
                    page.setData({
                        goods: res.data,
                        attr_group_list: res.data.attr_group_list,
                    });

                    page.goods_recommend({
                        'goods_id':res.data.id,
                        'reload':true,
                    });
                    if (page.data.goods.miaosha)
                        page.setMiaoshaTimeOver();
                    page.selectDefaultAttr();
                }
                if (res.code == 1) {
                    wx.showModal({
                        title: "提示",
                        content: res.msg,
                        showCancel: false,
                        success: function (res) {
                            if (res.confirm) {
                                wx.switchTab({
                                    url: "/pages/index/index"
                                });
                            }
                        }
                    });
                }
            }
        });
    },
    goodsModel: function (e) {
        var page = this;
        var carGoods = page.data.carGoods;
        var goodsModel = page.data.goodsModel;
        if (!goodsModel) {
            page.setData({
                goodsModel: true
            });
        } else {
            page.setData({
                goodsModel: false
            });
        }
    },
    hideGoodsModel: function () {
        this.setData({
            goodsModel: false
        });
    },
    close_box: function (e) {
        this.setData({
            showModal: false,
        });
    },
    showDialogBtn: function (e) {
        var page = this;
        page.setData({
            showModal:true,
        });
    },
    hideModal: function () {
        this.setData({
            showModal: false
        });
    },
    // 规格加购物车
    onConfirm: function (e) {
        var page = this;
        var attr_group_lists = page.data.attr_group_list;
        var checked_attr_list = [];
        var checked_attr_lists = [];
        var quick_goods = page.data.goods;
        for (var i in attr_group_lists) {
            var attr = false;
            for (var j in attr_group_lists[i].attr_list) {
                if (attr_group_lists[i].attr_list[j].checked) {
                    attr = {
                        attr_id: attr_group_lists[i].attr_list[j].attr_id,
                        attr_name: attr_group_lists[i].attr_list[j].attr_name,
                    };
                    break;
                }
            }
            if (!attr) {
                wx.showToast({
                    title: "请选择" + attr_group_lists[i].attr_group_name,
                    image: "/images/icon-warning.png",
                });
                return true;
            } else {
                checked_attr_list.push({
                    attr_id: attr.attr_id,
                    attr_name: attr.attr_name,
                });
                checked_attr_lists.push({
                    attr_group_id: attr_group_lists[i].attr_group_id,
                    attr_group_name: attr_group_lists[i].attr_group_name,
                    attr_id: attr.attr_id,
                    attr_name: attr.attr_name,
                });
            }
        }
        var carGoods = page.data.carGoods;
        var quick_goods_attr = JSON.parse(quick_goods.attr);
        var quick_goods_length = quick_goods_attr.length;
        for (var i = 0; i < quick_goods_length; i++) {
            var quick_attr = quick_goods_attr[i].attr_list
            if (JSON.stringify(quick_attr) == JSON.stringify(checked_attr_list)) {
                var check_goods_price = quick_goods_attr[i].price;
                var check_goods_num = quick_goods_attr[i].num;
            }
        }
        if (check_goods_price == 0) {
            var monery = parseFloat(quick_goods.price);
        } else {
            var monery = parseFloat(check_goods_price);
        }
        var good = {
            'goods_id': quick_goods.id,
            'num': 1,
            'goods_name': quick_goods.name,
            'attr': checked_attr_lists,
            'goods_price': monery,
            'price': monery,
        };
        var carGoods_length = carGoods.length;
        var flag = true;
        var check_num = 0;
        if (carGoods_length <= 0) {
            check_num = 1;
            carGoods.push(good)
        } else {
            for (var a = 0; a < carGoods_length; a++) {
                if (carGoods[a]['goods_id'] == quick_goods.id && JSON.stringify(carGoods[a]['attr']) == JSON.stringify(checked_attr_lists)) {
                    carGoods[a]['num'] += 1;
                    check_num = carGoods[a]['num'];
                    carGoods[a]['goods_price'] = check_num * monery;
                    carGoods[a]['goods_price'] = carGoods[a]['goods_price'].toFixed(2);
                    flag = false;
                }
            }
            if (flag) {
                carGoods.push(good)
                check_num = 1;
            }
        }
        if (check_num > check_goods_num) {
            wx.showToast({
                title: "商品库存不足",
                image: "/images/icon-warning.png",
            });
            check_num = check_goods_num;
            for (var a = 0; a < carGoods_length; a++) {
                if (carGoods[a]['goods_id'] == quick_goods.id && JSON.stringify(carGoods[a]['attr']) == JSON.stringify(checked_attr_lists)) {
                    carGoods[a]['num'] = check_goods_num;
                    carGoods[a]['goods_price'] -= monery
                    carGoods[a]['goods_price'] = carGoods[a]['goods_price'].toFixed(2);
                }
            }
            return
        }
        var goods_num = page.data.goods_num;
        goods_num+=1;
        var total = page.data.total;
        total.total_num += 1;
        total.total_price = parseFloat(total.total_price);
        monery = parseFloat(monery)
        total.total_price += monery;
        total.total_price = total.total_price.toFixed(2)
        var quick_hot_goods_lists = page.data.quick_hot_goods_lists;
        if (quick_hot_goods_lists){
            var quick_hot_goods = quick_hot_goods_lists.find(function (v) {
                return v.id == page.data.id
            })
            if (quick_hot_goods){
                quick_hot_goods.num += 1;
            }
        }
        var quick_list = page.data.quick_list;
        if (quick_list){
            var length = quick_list.length;
            var goods_all = [];
            for (var i = 0; i < length; i++) {
                var goods_cat_all = quick_list[i]['goods'];
                var goods_length = goods_cat_all.length;
                for (var a = 0; a < goods_length; a++) {
                    goods_all.push(goods_cat_all[a])
                }
            }
            var goods_all_length = goods_all.length;
            var goods = [];
            for (var x = 0; x < goods_all_length; x++) {
                if (goods_all[x]['id'] == page.data.id) {
                    goods.push(goods_all[x]);
                }
            }
            var goods_length = goods.length;
            for (var b = 0; b < goods_length; b++) {
                goods[b].num += 1;
            } 
        }
        page.setData({
            carGoods: carGoods,
            check_num: check_num,
            total: total,
            goods_num :goods_num
        });
        var item = {
            'quick_list': quick_list,
            'quick_hot_goods_lists': quick_hot_goods_lists,
            'carGoods': carGoods,
            'total': total
        }
        wx.setStorageSync("item", item)
    },
    // 规格减购物车
    guigejian:function(e){
        var page = this;
        var attr_group_lists = page.data.attr_group_list;
        var checked_attr_list = [];
        var checked_attr_lists = [];
        for (var i in attr_group_lists) {
            var attr = false;
            for (var j in attr_group_lists[i].attr_list) {
                if (attr_group_lists[i].attr_list[j].checked) {
                    attr = {
                        attr_id: attr_group_lists[i].attr_list[j].attr_id,
                        attr_name: attr_group_lists[i].attr_list[j].attr_name,
                    };
                    break;
                }
            }
            if (!attr) {
                wx.showToast({
                    title: "请选择" + attr_group_lists[i].attr_group_name,
                    image: "/images/icon-warning.png",
                });
                return true;
            } else {
                checked_attr_list.push({
                    attr_id: attr.attr_id,
                    attr_name: attr.attr_name,
                });
                checked_attr_lists.push({
                    attr_group_id: attr_group_lists[i].attr_group_id,
                    attr_group_name: attr_group_lists[i].attr_group_name,
                    attr_id: attr.attr_id,
                    attr_name: attr.attr_name,
                });
            }
        }
        var quick_goods = page.data.goods;
        var quick_goods_attr = JSON.parse(quick_goods.attr);
        var quick_goods_length = quick_goods_attr.length;
        for (var i = 0; i < quick_goods_length; i++) {
            var quick_attr = quick_goods_attr[i].attr_list
            if (JSON.stringify(quick_attr) == JSON.stringify(checked_attr_list)) {
                var check_goods_price = quick_goods_attr[i].price;
                var check_goods_num = quick_goods_attr[i].num;
            }
        }
        if (check_goods_price == 0) {
            var monery = parseFloat(quick_goods.price);
        } else {
            var monery = parseFloat(check_goods_price);
        }
        var carGoods = page.data.carGoods;
        var carGoods_length = carGoods.length;
        for (var a = 0; a < carGoods_length; a++) {
            if (carGoods[a]['goods_id'] == quick_goods.id && JSON.stringify(carGoods[a]['attr']) == JSON.stringify(checked_attr_lists)) {
                carGoods[a]['num'] -= 1;
                var check_num = carGoods[a]['num'];
                carGoods[a]['goods_price'] = check_num * monery
            }
        }
        var goods_num = page.data.goods_num;
        goods_num -= 1;

        var total = page.data.total;
        total.total_num -= 1;
        total.total_price = parseFloat(total.total_price);
        check_goods_price = parseFloat(check_goods_price)
        total.total_price -= check_goods_price;
        total.total_price = total.total_price.toFixed(2)
        var quick_hot_goods_lists = page.data.quick_hot_goods_lists;
        if (quick_hot_goods_lists) {
            var quick_hot_goods = quick_hot_goods_lists.find(function (v) {
                return v.id == page.data.id
            })
            if (quick_hot_goods) {
                quick_hot_goods.num -= 1;
            }
        }
        var quick_list = page.data.quick_list;
        if (quick_list) {
            var length = quick_list.length;
            var goods_all = [];
            for (var i = 0; i < length; i++) {
                var goods_cat_all = quick_list[i]['goods'];
                var goods_length = goods_cat_all.length;
                for (var a = 0; a < goods_length; a++) {
                    goods_all.push(goods_cat_all[a])
                }
            }
            var goods_all_length = goods_all.length;
            var goods = [];
            for (var x = 0; x < goods_all_length; x++) {
                if (goods_all[x]['id'] == page.data.id) {
                    goods.push(goods_all[x]);
                }
            }
            var goods_length = goods.length;
            for (var b = 0; b < goods_length; b++) {
                goods[b].num -= 1;
            }
        }
        page.setData({
            carGoods: carGoods,
            check_num: check_num,
            total: total,
            goods_num: goods_num
        });
        var item = {
            'quick_list': quick_list,
            'quick_hot_goods_lists': quick_hot_goods_lists,
            'carGoods': carGoods,
            'total': total
        }
        wx.setStorageSync("item", item)

    },
    // 加购物车
    jia:function(e){
        var page = this;
        var quick_goods = page.data.goods;
        var goods_num = page.data.goods_num;
        goods_num += 1;
        var quick_goods_attr = JSON.parse(quick_goods.attr);
        if (goods_num > quick_goods_attr[0].num){
            wx.showToast({
                title: "商品库存不足",
                image: "/images/icon-warning.png",
            });
            goods_num -= 1;
            return 
        }
        var total = page.data.total;
        total.total_num += 1;
        quick_goods.price = parseFloat(quick_goods.price);
        total.total_price = parseFloat(total.total_price)
        total.total_price += quick_goods.price;
        total.total_price = total.total_price.toFixed(2)

        var goods_price = parseFloat(quick_goods.price * goods_num);
        var good = {
            'goods_id': quick_goods.id,
            'num': 1,
            'goods_name': quick_goods.name,
            'attr': '',
            'goods_price': goods_price.toFixed(2),
            'price': quick_goods.price.toFixed(2),
        };
        var carGoods = page.data.carGoods;
        var length = carGoods.length;
        var flag = true;
        if (length <= 0) {
            carGoods.push(good)
        } else {
            for (var a = 0; a < length; a++) {
                if (carGoods[a]['goods_id'] == quick_goods.id) {
                    carGoods[a]['num'] += 1;
                    carGoods[a]['goods_price'] = goods_price.toFixed(2);
                    flag = false;
                }
            }
            if (flag) {
                carGoods.push(good)
            }
        }
        var quick_hot_goods_lists = page.data.quick_hot_goods_lists;
        if (quick_hot_goods_lists) {
            var quick_hot_goods = quick_hot_goods_lists.find(function (v) {
                return v.id == page.data.id
            })
            if (quick_hot_goods) {
                quick_hot_goods.num += 1;
            }
        }
        var quick_list = page.data.quick_list;
        if (quick_list) {
            var length = quick_list.length;
            var goods_all = [];
            for (var i = 0; i < length; i++) {
                var goods_cat_all = quick_list[i]['goods'];
                var goods_length = goods_cat_all.length;
                for (var a = 0; a < goods_length; a++) {
                    goods_all.push(goods_cat_all[a])
                }
            }
            var goods_all_length = goods_all.length;
            var goods = [];
            for (var x = 0; x < goods_all_length; x++) {
                if (goods_all[x]['id'] == page.data.id) {
                    goods.push(goods_all[x]);
                }
            }
            var goods_length = goods.length;
            for (var b = 0; b < goods_length; b++) {
                goods[b].num += 1;
            }
        }
        page.setData({
            goods_num: goods_num,
            carGoods: carGoods,
            total:total,
        });
        var item = {
            'quick_list': quick_list,
            'quick_hot_goods_lists': quick_hot_goods_lists,
            'carGoods': carGoods,
            'total': total
        }
        wx.setStorageSync("item", item)
    },
    // jian
    jian:function(){
        var page = this;
        var quick_goods = page.data.goods;

        var goods_num = page.data.goods_num;
        goods_num -= 1;  

        var total = page.data.total;
        total.total_num -= 1;
        quick_goods.price = parseFloat(quick_goods.price);
        total.total_price = parseFloat(total.total_price)
        total.total_price -= quick_goods.price;
        total.total_price = total.total_price.toFixed(2)

        var carGoods = page.data.carGoods;
        var length = carGoods.length;
        for (var a = 0; a < length; a++) {
            if (carGoods[a]['goods_id'] == quick_goods.id) {
                carGoods[a]['num'] -= 1;
                carGoods[a]['goods_price'] = parseFloat(carGoods[a]['goods_price']);
                carGoods[a]['goods_price'] -= quick_goods.price;
                carGoods[a]['goods_price'] = carGoods[a]['goods_price'].toFixed(2)
            }
        }
        var quick_hot_goods_lists = page.data.quick_hot_goods_lists;
        if (quick_hot_goods_lists) {
            var quick_hot_goods = quick_hot_goods_lists.find(function (v) {
                return v.id == page.data.id
            })
            if (quick_hot_goods) {
                quick_hot_goods.num -= 1;
            }
        }

        var quick_list = page.data.quick_list;
        if (quick_list) {
            var length = quick_list.length;
            var goods_all = [];
            for (var i = 0; i < length; i++) {
                var goods_cat_all = quick_list[i]['goods'];
                var goods_length = goods_cat_all.length;
                for (var a = 0; a < goods_length; a++) {
                    goods_all.push(goods_cat_all[a])
                }
            }
            var goods_all_length = goods_all.length;
            var goods = [];
            for (var x = 0; x < goods_all_length; x++) {
                if (goods_all[x]['id'] == page.data.id) {
                    goods.push(goods_all[x]);
                }
            }
            var goods_length = goods.length;
            for (var b = 0; b < goods_length; b++) {
                goods[b].num -= 1;
            }
        }
        page.setData({
            goods_num: goods_num,
            carGoods: carGoods,
            total: total,
        });  
        var item = {
            'quick_list': quick_list,
            'quick_hot_goods_lists': quick_hot_goods_lists,
            'carGoods': carGoods,
            'total': total
        }
        wx.setStorageSync("item", item)     
    },
    // 添加
    tianjia:function(e){
        var page = this;
        var data = e.currentTarget.dataset;
        var quick_list = page.data.quick_list;
        var quick_goods = page.data.goods;
        if (quick_list){
            var length = quick_list.length;
            var quick_list_goods = [];
            for (var i = 0; i < length; i++) {
                var goods = quick_list[i]['goods'];
                var goods_length = goods.length;
                for (var a = 0; a < goods_length; a++) {
                    quick_list_goods.push(goods[a])
                }
            }
            var quick_list_goods_length = quick_list_goods.length;
            var check_goods = [];
            for (var b = 0; b < quick_list_goods_length; b++) {
                if (quick_list_goods[b].id == data.id) {
                    check_goods.push(quick_list_goods[b])
                }
            }
            var goods_attr = JSON.parse(check_goods[0]['attr']);
            if (goods_attr.length == 1) {
                var carGoods_list = page.data.carGoods;
                var car_goods = carGoods_list.find(function (v) {
                    return v.goods_id == data.id
                })
                car_goods['num'] += 1;
                if (car_goods.num > goods_attr[0]['num']) {
                    wx.showToast({
                        title: "商品库存不足",
                        image: "/images/icon-warning.png",
                    });
                    car_goods['num'] -= 1;
                    return
                }
                car_goods['goods_price'] = parseFloat(car_goods['goods_price'])
                data.price = parseFloat(data.price)
                car_goods['goods_price'] += data.price;
                car_goods['goods_price'] = car_goods['goods_price'].toFixed(2)
                var check_goods_length = check_goods.length;
                for (var x = 0; x < check_goods_length; x++) {
                    check_goods[x].num += 1;
                }
            } else {
                var check_goods_length = check_goods.length;
                for (var x = 0; x < check_goods_length; x++) {
                    check_goods[x].num += 1;
                }
                var carGoods_list = page.data.carGoods;
                var carGoods_list_length = carGoods_list.length;
                var check_attr_list = [];
                for (var a = 0; a < carGoods_list_length; a++) {
                    if (data.index == a) {
                        var check_attr = carGoods_list[a]['attr'];
                        var check_attr_length = check_attr.length;
                        for (var i = 0; i < check_attr_length; i++) {
                            var attrs_list = {
                                'attr_id': check_attr[i]['attr_id'],
                                'attr_name': check_attr[i]['attr_name']
                            }
                            check_attr_list.push(attrs_list)
                        }
                    }
                }
                var attr_length = goods_attr.length;
                for (var i = 0; i < attr_length; i++) {
                    if (JSON.stringify(goods_attr[i]['attr_list']) == JSON.stringify(check_attr_list)) {
                        var check_goods_num = goods_attr[i]['num'];
                    }
                }
                for (var a = 0; a < carGoods_list_length; a++) {
                    if (data.index == a) {
                        carGoods_list[a]['num'] += 1;
                        carGoods_list[a]['goods_price'] = parseFloat(carGoods_list[a]['goods_price'])
                        data.price = parseFloat(data.price)
                        carGoods_list[a]['goods_price'] += data.price;
                        carGoods_list[a]['goods_price'] = carGoods_list[a]['goods_price'].toFixed(2)

                        if (carGoods_list[a]['num'] > check_goods_num) {
                            wx.showToast({
                                title: "商品库存不足",
                                image: "/images/icon-warning.png",
                            });
                            carGoods_list[a]['num'] -= 1;
                            var check_goods_length = check_goods.length;
                            for (var x = 0; x < check_goods_length; x++) {
                                check_goods[x].num -= 1;
                            }
                            carGoods_list[a]['goods_price'] -= data.price;
                            carGoods_list[a]['goods_price'] = carGoods_list[a]['goods_price'].toFixed(2)
                            return
                        }
                    }
                }
            }
            var quick_hot_goods_lists = page.data.quick_hot_goods_lists;
            if (quick_hot_goods_lists) {
                var quick_hot_goods = quick_hot_goods_lists.find(function (v) {
                    return v.id == data.id
                })
                if (quick_hot_goods) {
                    quick_hot_goods.num += 1;
                }
            }
        }else{
            var carGoods_list = page.data.carGoods;
            var quick_attr = carGoods_list[data.index].attr;
            var attrs = [];
            if (quick_attr){
                var quick_attr_length = quick_attr.length;
                for (var a = 0; a < quick_attr_length; a++) {
                    attrs.push({
                        attr_id:quick_attr[a].attr_id,
                        attr_name:quick_attr[a].attr_name
                    })
                }
            }
            if (quick_goods.use_attr == 0){
                var attr = JSON.parse(quick_goods.attr)
                var num = attr[0].num;
            }else{
                var attr = JSON.parse(quick_goods.attr);
                var quick_goods_length = attr.length;
                for (var i = 0; i < quick_goods_length; i++) {
                    var quick_attrs = attr[i].attr_list
                    if (JSON.stringify(quick_attrs) == JSON.stringify(attrs)) {
                        var num = attr[i].num;
                    }
                }
            }
            carGoods_list[data.index].num += 1;
            carGoods_list[data.index].goods_price = parseFloat(carGoods_list[data.index].goods_price);
            data.price = parseFloat(data.price);
            carGoods_list[data.index].goods_price += data.price
            carGoods_list[data.index].goods_price = carGoods_list[data.index].goods_price.toFixed(2);

            if (carGoods_list[data.index].num > num){
                wx.showToast({
                    title: "商品库存不足",
                    image: "/images/icon-warning.png",
                });
                carGoods_list[data.index].num = num;
                return
            }
        }

        var total = page.data.total;
        total.total_num += 1;
        total.total_price = parseFloat(total.total_price)
        data.price = parseFloat(data.price)
        total.total_price += data.price;
        total.total_price = total.total_price.toFixed(2);

        var goods_num = page.data.goods_num;
        goods_num+=1;
        page.setData({
            'carGoods': carGoods_list,
            'total': total,
            'goods_num': goods_num
        })
        var item = {
            'quick_list': quick_list,
            'quick_hot_goods_lists': quick_hot_goods_lists,
            'carGoods': carGoods_list,
            'total': total
        }
        wx.setStorageSync("item", item)  

    },

    // 减少
    jianshao: function (e) {
        var page = this;
        var data = e.currentTarget.dataset;
        var carGoods = page.data.carGoods;
        var length = carGoods.length;
        for (var a = 0; a < length; a++) {
            if (data.index == a) {
                if (carGoods[a].num <= 0) {
                    return
                }
                carGoods[a].num -= 1;
                data.price = parseFloat(data.price)
                carGoods[a].goods_price = parseFloat(carGoods[a].goods_price)
                carGoods[a].goods_price -= data.price;
                carGoods[a].goods_price = carGoods[a].goods_price.toFixed(2);
            }
        }
        page.setData({
            'carGoods': carGoods
        })
        var quick_list = page.data.quick_list;
        if (quick_list){
            var length = quick_list.length;
            var carGood = [];
            for (var i = 0; i < length; i++) {
                var good = quick_list[i]['goods'];
                var length2 = good.length;
                for (var a = 0; a < length2; a++) {
                    carGood.push(good[a])
                }
            }
            var quick_list_car_goods = [];
            var carGood_length = carGood.length;
            for (var a = 0; a < carGood_length; a++) {
                if (data.id == carGood[a]['id']) {
                    quick_list_car_goods.push(carGood[a])
                }
            }
            var quick_list_car_goods_length = quick_list_car_goods.length;
            for (var b = 0; b < quick_list_car_goods_length; b++) {
                if (quick_list_car_goods[b].id == data.id) {
                    quick_list_car_goods[b].num -= 1;
                }
            }
            var quick_hot_goods_lists = page.data.quick_hot_goods_lists;
            var quick_hot_goods = quick_hot_goods_lists.find(function (v) {
                return v.id == data.id
            })
            if (quick_hot_goods) {
                quick_hot_goods.num -= 1;
            }
        }


        var total = page.data.total;
        total.total_num -= 1;
        total.total_price = parseFloat(total.total_price);
        total.total_price -= data.price;
        total.total_price = total.total_price.toFixed(2);


        var goods_num = page.data.goods_num;
        goods_num -= 1;
        var goods_num = page.data.goods_num;
        goods_num -= 1;
        page.setData({
            'total': total,
            'goods_num': goods_num
        })
        if (total.total_num == 0) {
            page.setData({
                goodsModel: false
            });
        }
        var item = {
            'quick_list': quick_list,
            'quick_hot_goods_lists': quick_hot_goods_lists,
            'carGoods': carGoods,
            'total': total
        }
        wx.setStorageSync("item", item)  
    },

    clearCar:function(){
        var page = this;
        var goods_num = page.data.goods_num;
        goods_num = 0;
        var total = page.data.total;
        total.total_num = 0;
        total.total_price = 0;
        var goodsModel = page.data.goodsModel;
        var carGoods = page.data.carGoods;
        var length = carGoods.length;
        for (var i = 0; i < length; i++) {
            carGoods[i]['num'] = 0;
            carGoods[i]['goods_price'] = 0;
        }
        var quick_list = page.data.quick_list;
        var length = quick_list.length;
        for (var i = 0; i < length; i++) {
            var goods = quick_list[i]['goods'];
            var length2 = goods.length;
            for (var a = 0; a < length2; a++) {
                goods[a]['num'] = 0;
            }
        }
        var quick_hot_goods_lists = page.data.quick_hot_goods_lists;
        var quick_hot_goods_lists_length = quick_hot_goods_lists.length;
        for (var x = 0; x < quick_hot_goods_lists_length; x++) {
            quick_hot_goods_lists[x]['num'] = 0;
        }
        page.setData({
            'carGoods': carGoods,
            'total': total,
            'goods_num': goods_num,
            'goodsModel': false,
            'quick_list': quick_list,
            'quick_hot_goods_lists': quick_hot_goods_lists
        });
        var check_num = page.data.check_num;
        if (check_num){
            check_num = 0;
            page.setData({
                check_num: check_num,
            });
        }
        var items = wx.getStorageSync('item');
        if (items) {
            wx.removeStorageSync('item');
        }  
        
    },

    buynow: function (e) {
        var page = this;
        var carGoods = page.data.carGoods;
        var goodsModel = page.data.goodsModel;
        page.setData({
            goodsModel: false
        });
        var length = carGoods.length;
        var cart_list = [];
        var cart_list_goods = [];
        for (var a = 0; a < length; a++) {
            if (carGoods[a].num != 0) {
                cart_list_goods = {
                    'id': carGoods[a].goods_id,
                    'num': carGoods[a].num,
                    'attr': carGoods[a].attr
                }
                cart_list.push(cart_list_goods)
            }
        }
        wx.navigateTo({
            url: '/pages/order-submit/order-submit?cart_list=' + JSON.stringify(cart_list),
        });
    },
    
    selectDefaultAttr: function () {
        var page = this;
        if (!page.data.goods || page.data.goods.use_attr !== 0)
            return;
        for (var i in page.data.attr_group_list) {
            for (var j in page.data.attr_group_list[i].attr_list) {
                if (i == 0 && j == 0)
                    page.data.attr_group_list[i].attr_list[j]['checked'] = true;
            }
        }
        page.setData({
            attr_group_list: page.data.attr_group_list,
        });
    },
    getCommentList: function (more) {
        var page = this;
        if (more && page.data.tab_comment != "active")
            return;
        if (is_loading_comment)
            return;
        if (!is_more_comment)
            return;
        is_loading_comment = true;
        app.request({
            url: api.default.comment_list,
            data: {
                goods_id: page.data.id,
                page: p,
            },
            success: function (res) {
                if (res.code != 0)
                    return;
                is_loading_comment = false;
                p++;
                page.setData({
                    comment_count: res.data.comment_count,
                    comment_list: more ? page.data.comment_list.concat(res.data.list) : res.data.list,
                });
                if (res.data.list.length == 0)
                    is_more_comment = false;
            }
        });
    },

    onGoodsImageClick: function (e) {
        var page = this;
        var urls = [];
        var index = e.currentTarget.dataset.index;
        //console.log(page.data.goods.pic_list);
        for (var i in page.data.goods.pic_list) {
            urls.push(page.data.goods.pic_list[i].pic_url);
        }
        wx.previewImage({
            urls: urls, // 需要预览的图片http链接列表
            current: urls[index],
        });
    },

    numberSub: function () {
        var page = this;
        var num = page.data.form.number;
        if (num <= 1)
            return true;
        num--;
        page.setData({
            form: {
                number: num,
            }
        });
    },

 

    numberAdd: function () {
        var page = this;
        var num = page.data.form.number;
        num++;
        page.setData({
            form: {
                number: num,
            }
        });
    },

    numberBlur: function (e) {
        var page = this;
        var num = e.detail.value;
        num = parseInt(num);
        if (isNaN(num))
            num = 1;
        if (num <= 0)
            num = 1;
        page.setData({
            form: {
                number: num,
            }
        });
    },

    addCart: function () {
        this.submit('ADD_CART');
    },

    buyNow: function () {
        this.submit('BUY_NOW');
    },

    submit: function (type) {
        var page = this;
        if (!page.data.show_attr_picker) {
            page.setData({
                show_attr_picker: true,
            });
            return true;
        }
        if (page.data.miaosha_data && page.data.miaosha_data.rest_num > 0 && page.data.form.number > page.data.miaosha_data.rest_num) {
            wx.showToast({
                title: "商品库存不足，请选择其它规格或数量",
                image: "/images/icon-warning.png",
            });
            return true;
        }

        if (page.data.form.number > page.data.goods.num) {
            wx.showToast({
                title: "商品库存不足，请选择其它规格或数量",
                image: "/images/icon-warning.png",
            });
            return true;
        }
        var attr_group_list = page.data.attr_group_list;
        var checked_attr_list = [];
        for (var i in attr_group_list) {
            var attr = false;
            for (var j in attr_group_list[i].attr_list) {
                if (attr_group_list[i].attr_list[j].checked) {
                    attr = {
                        attr_id: attr_group_list[i].attr_list[j].attr_id,
                        attr_name: attr_group_list[i].attr_list[j].attr_name,
                    };
                    break;
                }
            }
            if (!attr) {
                wx.showToast({
                    title: "请选择" + attr_group_list[i].attr_group_name,
                    image: "/images/icon-warning.png",
                });
                return true;
            } else {
                checked_attr_list.push({
                    attr_group_id: attr_group_list[i].attr_group_id,
                    attr_group_name: attr_group_list[i].attr_group_name,
                    attr_id: attr.attr_id,
                    attr_name: attr.attr_name,
                });
            }
        }
        if (type == 'ADD_CART') {//加入购物车
            wx.showLoading({
                title: "正在提交",
                mask: true,
            });
            app.request({
                url: api.cart.add_cart,
                method: "POST",
                data: {
                    goods_id: page.data.id,
                    attr: JSON.stringify(checked_attr_list),
                    num: page.data.form.number,
                },
                success: function (res) {
                    wx.showToast({
                        title: res.msg,
                        duration: 1500
                    });
                    wx.hideLoading();
                    page.setData({
                        show_attr_picker: false,
                    });

                }
            });
        }
        if (type == 'BUY_NOW') {//立即购买
            page.setData({
                show_attr_picker: false,
            });
            wx.redirectTo({
                url: "/pages/order-submit/order-submit?goods_info=" + JSON.stringify({
                    goods_id: page.data.id,
                    attr: checked_attr_list,
                    num: page.data.form.number,
                }),
            });
        }

    },

    hideAttrPicker: function () {
        var page = this;
        page.setData({
            show_attr_picker: false,
        });
    },
    showAttrPicker: function () {
        var page = this;
        page.setData({
            show_attr_picker: true,
        });
    },

    attrClick: function (e) {
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
                if (attr){
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
                }else{
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
            success: function (res) {
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


    favoriteAdd: function () {
        var page = this;
        app.request({
            url: api.user.favorite_add,
            method: "post",
            data: {
                goods_id: page.data.goods.id,
            },
            success: function (res) {
                if (res.code == 0) {
                    var goods = page.data.goods;
                    goods.is_favorite = 1;
                    page.setData({
                        goods: goods,
                    });
                }
            }
        });
    },

    favoriteRemove: function () {
        var page = this;
        app.request({
            url: api.user.favorite_remove,
            method: "post",
            data: {
                goods_id: page.data.goods.id,
            },
            success: function (res) {
                if (res.code == 0) {
                    var goods = page.data.goods;
                    goods.is_favorite = 0;
                    page.setData({
                        goods: goods,
                    });
                }
            }
        });
    },

    tabSwitch: function (e) {
        var page = this;
        var tab = e.currentTarget.dataset.tab;
        if (tab == "detail") {
            page.setData({
                tab_detail: "active",
                tab_comment: "",
            });
        } else {
            page.setData({
                tab_detail: "",
                tab_comment: "active",
            });
        }
    },
    commentPicView: function (e) {
        console.log(e);
        var page = this;
        var index = e.currentTarget.dataset.index;
        var pic_index = e.currentTarget.dataset.picIndex;
        wx.previewImage({
            current: page.data.comment_list[index].pic_list[pic_index],
            urls: page.data.comment_list[index].pic_list,
        });
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
        var item = wx.getStorageSync('item')
        if (item){
            var total = item.total;
            var carGoods = item.carGoods;
            var goods_num = page.data.goods_num;
        }else{
            var total = {
                total_price: 0.00,
                total_num: 0
            }   
            var carGoods = [];  
            var goods_num = 0;
        }
        page.setData({
            total: total,
            carGoods:carGoods,
            goods_num: goods_num
        });
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {
        var page = this;

        if(page.data.tab_detail=='active' && page.data.drop){
            page.data.drop = false;
            page.goods_recommend({
                'goods_id':page.data.goods.id,
                'loadmore':true
            });
            
        }else if(page.data.tab_comment=='active'){
            page.getCommentList(true);
        }
        
    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {
        var page = this;
        var user_info = wx.getStorageSync("user_info");
        var res = {
            path: "/pages/goods/goods?id=" + this.data.id + "&user_id=" + user_info.id,
            success: function (e) {
                console.log(e);
                share_count++;
                if (share_count == 1)
                    app.shareSendCoupon(page);
            },
            title: page.data.goods.name,
            imageUrl: page.data.goods.pic_list[0].pic_url,
        };
        return res;
    },
    play: function (e) {
        var url = e.target.dataset.url;//获取视频链接
        this.setData({
            url: url,
            hide: '',
            show: true,
        });
        var videoContext = wx.createVideoContext('video');
        videoContext.play();
    },

    close: function (e) {
        if (e.target.id == 'video') {
            return true;
        }
        this.setData({
            hide: "hide",
            show: false
        });
        var videoContext = wx.createVideoContext('video');
        videoContext.pause();
    },
    hide: function (e) {
        if (e.detail.current == 0) {
            this.setData({
                img_hide: ""
            });
        } else {
            this.setData({
                img_hide: "hide"
            });
        }
    },

    showShareModal: function () {
        var page = this;
        page.setData({
            share_modal_active: "active",
            no_scroll: true,
        });
    },

    shareModalClose: function () {
        var page = this;
        page.setData({
            share_modal_active: "",
            no_scroll: false,
        });
    },

    getGoodsQrcode: function () {
        var page = this;
        page.setData({
            goods_qrcode_active: "active",
            share_modal_active: "",
        });
        if (page.data.goods_qrcode)
            return true;
        app.request({
            url: api.default.goods_qrcode,
            data: {
                goods_id: page.data.id,
            },
            success: function (res) {
                if (res.code == 0) {
                    page.setData({
                        goods_qrcode: res.data.pic_url,
                    });
                }
                if (res.code == 1) {
                    page.goodsQrcodeClose();
                    wx.showModal({
                        title: "提示",
                        content: res.msg,
                        showCancel: false,
                        success: function (res) {
                            if (res.confirm) {

                            }
                        }
                    });
                }
            },
        });
    },

    goodsQrcodeClose: function () {
        var page = this;
        page.setData({
            goods_qrcode_active: "",
            no_scroll: false,
        });
    },

    saveGoodsQrcode: function () {
        var page = this;
        if (!wx.saveImageToPhotosAlbum) {
            // 如果希望用户在最新版本的客户端上体验您的小程序，可以这样子提示
            wx.showModal({
                title: '提示',
                content: '当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。',
                showCancel: false,
            });
            return;
        }

        wx.showLoading({
            title: "正在保存图片",
            mask: false,
        });

        wx.downloadFile({
            url: page.data.goods_qrcode,
            success: function (e) {
                wx.showLoading({
                    title: "正在保存图片",
                    mask: false,
                });
                wx.saveImageToPhotosAlbum({
                    filePath: e.tempFilePath,
                    success: function () {
                        wx.showModal({
                            title: '提示',
                            content: '商品海报保存成功',
                            showCancel: false,
                        });
                    },
                    fail: function (e) {
                        wx.showModal({
                            title: '图片保存失败',
                            content: e.errMsg,
                            showCancel: false,
                        });
                    },
                    complete: function (e) {
                        console.log(e);
                        wx.hideLoading();
                    }
                });
            },
            fail: function (e) {
                wx.showModal({
                    title: '图片下载失败',
                    content: e.errMsg + ";" + page.data.goods_qrcode,
                    showCancel: false,
                });
            },
            complete: function (e) {
                console.log(e);
                wx.hideLoading();
            }
        });

    },

    goodsQrcodeClick: function (e) {
        var src = e.currentTarget.dataset.src;
        wx.previewImage({
            urls: [src],
        });
    },
    closeCouponBox: function (e) {
        this.setData({
            get_coupon_list: ""
        });
    },

    setMiaoshaTimeOver: function () {
        var page = this;

        function _init() {
            var time_over = page.data.goods.miaosha.end_time - page.data.goods.miaosha.now_time;
            time_over = time_over < 0 ? 0 : time_over;
            page.data.goods.miaosha.now_time++;
            page.setData({
                goods: page.data.goods,
                miaosha_end_time_over: secondToTime(time_over),
            });
        }

        _init();
        setInterval(function () {
            _init();
        }, 1000);

        function secondToTime(second) {
            var _h = parseInt(second / 3600);
            var _m = parseInt((second % 3600) / 60);
            var _s = second % 60;

            return {
                h: _h < 10 ? ("0" + _h) : ("" + _h),
                m: _m < 10 ? ("0" + _m) : ("" + _m),
                s: _s < 10 ? ("0" + _s) : ("" + _s),
            };
        }
    },
    to_dial: function (e) {
      var contact_tel = this.data.store.contact_tel;
      wx.makePhoneCall({
        phoneNumber: contact_tel
      })
    },

    goods_recommend: function(args){
        var page = this;
        page.setData({
            is_loading: true,
        });

        var p = page.data.page || 2;
        app.request({ 
            url: api.default.goods_recommend, 
            data: {
                goods_id: args.goods_id,
                page: p,
            },
            success: function (res) {

                if (res.code == 0) {
                    if (args.reload) {
                        var goods_list = res.data.list;
                    };
                    if (args.loadmore) {
                         var goods_list = page.data.goods_list.concat(res.data.list);
                    };
                    page.data.drop = true;
                    page.setData({goods_list:goods_list})
                    page.setData({page: (p + 1)});
               };

           },
            complete: function () {
                page.setData({
                    is_loading: false,
                });
            }
       });
    },

});