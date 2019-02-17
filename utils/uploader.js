module.exports = {
  uploadProducts: function (args,count) {
    console.log('user args:', args);
    var app = getApp();
    args = args || {};
    args.complete = args.complete || function () {
    };
    args.data = args.data || {};
    args.data._uniacid = args.data._uniacid || app.siteInfo.uniacid;
    args.data._acid = args.data._acid || app.siteInfo.acid;
    wx.chooseImage({
      count: count,
      success: function (e) {
        console.log('--chooseImage--');
        console.log(e);
        if (e.tempFiles && e.tempFiles.length > 0) {

          for (var i = 0; i < e.tempFiles.length; i++) {
            var file = e.tempFiles[i];
            upload(file);
          }

        } else {
          if (typeof args.error == 'function') {
            args.error('请选择文件');
          }
          args.complete();
        }
      },
      fail: function (e) {
        if (typeof args.error == 'function') {
          args.error('请选择文件');
          args.complete();
        }
      },
    });

    function upload(file) {
      if (typeof args.start == 'function') {
        args.start(file);
      }
      console.log('submit args:', args);
      wx.uploadFile({
        url: args.url || app.api.default.upload_image,
        filePath: file.path,
        name: args.name || 'image',
        formData: args.data || {},
        success: function (e) {
          console.log('--uploadFile--');
          console.log(e);
          if (e.statusCode == 200) {
            if (typeof args.success == 'function') {
              e.data = JSON.parse(e.data);
              args.success(e.data);
            }
          } else {
            if (typeof args.error == 'function') {
              args.error('上传错误：' + e.statusCode + '；' + e.data);
            }
          }
          args.complete();

        },
        fail: function (e) {
          if (typeof args.error == 'function') {
            args.error(e.errMsg);
          }
          args.complete();

        },
      });
    }


  },
  upload: function (args) {
    console.log('user args:', args);
    var app = getApp();
    args = args || {};
    args.complete = args.complete || function () {
    };
    args.data = args.data || {};
    args.data._uniacid = args.data._uniacid || app.siteInfo.uniacid;
    args.data._acid = args.data._acid || app.siteInfo.acid;
    wx.chooseImage({
      count: 1,
      success: function (e) {
        console.log('--chooseImage--');
        console.log(e);
        if (e.tempFiles && e.tempFiles.length > 0) {
          var file = e.tempFiles[0];
          upload(file);
        } else {
          if (typeof args.error == 'function') {
            args.error('请选择文件');
          }
          args.complete();
        }
      },
      fail: function (e) {
        if (typeof args.error == 'function') {
          args.error('请选择文件');
          args.complete();
        }
      },
    });

    function upload(file) {
      if (typeof args.start == 'function') {
        args.start(file);
      }
      console.log('submit args:', args);
      wx.uploadFile({
        url: args.url || app.api.default.upload_image,
        filePath: file.path,
        name: args.name || 'image',
        formData: args.data || {},
        success: function (e) {
          console.log('--uploadFile--');
          console.log(e);
          if (e.statusCode == 200) {
            if (typeof args.success == 'function') {
              e.data = JSON.parse(e.data);
              args.success(e.data);
            }
          } else {
            if (typeof args.error == 'function') {
              args.error('上传错误：' + e.statusCode + '；' + e.data);
            }
          }
          args.complete();

        },
        fail: function (e) {
          if (typeof args.error == 'function') {
            args.error(e.errMsg);
          }
          args.complete();

        },
      });
    }

  },
  uploadMore: function (args, count) {
   var pic_list=[];


    console.log('user args:', args);
    var app = getApp();
    args = args || {};
    args.complete = args.complete || function () {
    };
    args.data = args.data || {};
    args.data._uniacid = args.data._uniacid || app.siteInfo.uniacid;
    args.data._acid = args.data._acid || app.siteInfo.acid;
    wx.chooseImage({
      count: count,
      success: function (e) {
        console.log('--chooseImage--');
        console.log(e);
        if (e.tempFiles && e.tempFiles.length > 0) {

          for (var i = 0; i < e.tempFiles.length; i++) {
            var file = e.tempFiles[i];
            upload(file,e.tempFiles.length);
          }

        } else {
          if (typeof args.error == 'function') {
            args.error('请选择文件');
          }
          args.complete();
        }
      },
      fail: function (e) {
        if (typeof args.error == 'function') {
          args.error('请选择文件');
          args.complete();
        }
      },
    });

    function upload(file,pic_count) {
      if (typeof args.start == 'function') {
        args.start(file);
      }
      console.log('submit args:', args);
      wx.uploadFile({
        url: args.url || app.api.default.upload_image_order,
        filePath: file.path,
        name: args.name || 'image',
        formData: args.data || {},
        success: function (e) {
          console.log('--uploadFile--');
          console.log(e);
          if (e.statusCode == 200) {

         pic_list.push(e.data.url);
            if (pic_list.length == pic_count){
            console.log("全部上传完成");
              args.complete();

            }


            if (typeof args.success == 'function') {
              e.data = JSON.parse(e.data);
              args.success(e.data);
            }
          } else {
            if (typeof args.error == 'function') {
              args.error('上传错误：' + e.statusCode + '；' + e.data);
            }
          }
 

        },
        fail: function (e) {
          if (typeof args.error == 'function') {
            args.error(e.errMsg);
          }
          args.complete();

        },
      });
    }

  },
};