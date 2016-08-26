var express = require('express');
var router = express.Router();

/* GET home page. */
//默认进入登录界面
router.get('/', function(req, res, next) {
  return res.render('login', { title: '前往登陆' });
});

//前往登录界面
router.get('/login', function(req, res, next) {
  return res.render('login', {title: '前往登录'});
});

//进行登录
router.route('/login').get(function(req, res) {
  return res.render('login', {title: '登陆'})
}).post(function(req, res) {
  var order = global.dbHandle.getModel('order');
  var username = req.body.username.trim();
  console.log('------------' + username.length);
  order.findOne({username:username}, function(err, doc) {
    if (err) {
      res.send(500);
      console.log(err);
    } else if (!doc) {
      req.session.error = '用户名不存在';
      res.send(404);
    } else {
      if (req.body.password != doc.password) {
        req.session.error = '密码错误';
        res.send(404);
      } else {
        req.session.user = doc;
        res.send(200);
      }
    }
  });
});

//前往注册页面
router.get('/register', function(req, res, next) {
  return res.render('register', {title: '前往注册'});
});

//注册
router.route('/register').get(function(req, res) {
  return res.render('register', {title: '注册'});
}).post(function(req, res) {
  var order = global.dbHandle.getModel('order');
  var username = req.body.username.trim();
  var password = req.body.password;
  var role = req.body.depart;
  console.log(role);
  order.findOne({username, password, role}, function(err, doc) {
    console.log(doc + '============' + err);
    if (err) {
      res.send(500);
      req.session.error = '网络异常错误';
    } else if (doc) {
      req.session.error = '该用户名已经存在';
      res.send(500);
    } else {
      order.create({
        username: username,
        password: password,
        role:role,
      }, function(err, doc) {
        if (err) {
            res.send(500);
            console.log(err);
        } else {
          req.session.error = '用户名创建成功!';
          res.send(200);
        }
      });
    }
  });
});

//前往主页
router.get('/home', function(req, res, next) {
  if (!req.session.user) {
    req.session.error = '请先登录';
    return res.redirect("/login");
  }
  console.log('你来首页了' + req.session.user.username);
  return res.render('home', {username: req.session.user.username});
});

//获取主页数据
router.route('/home').get(function(req, res) {
  return res.render('home', {title: '获取主页数据'});
}).post(function(req, res) {
  console.log('你来获取主页数据' + JSON.stringify(req.body));
  var order = global.dbHandle.getModel('order');
  var dinner = req.body.dinner;
  var lunch = req.body.lunch;
  var year = req.body.year;
  var month = req.body.month;
  var username = req.session.user.username;
  //修改之前查询该用户是否已经提交过数据
  order.findOne({username}, function(err, doc) {
    console.log('=======' + doc.lunch.length + '数据库中查询到的数据:' + doc.dinner.length);
    if (err) {
      res.send(500);
      console.log(err);
    }
    if (doc) {
      if (doc.lunch.length != 0 && lunch) {
        req.session.error = '该用户已经选择过午餐';
        return res.send(404);
      } else {
        if (doc.dinner.length != 0 && dinner) {
          req.session.error = '该用户已经选择过晚餐';
          return res.send(404);
        }
      }
    }

    //更新晚餐
    if (dinner || lunch) {
      if (!dinner && doc.dinner) {
        dinner = doc.dinner;
      }
      if (!lunch && doc.lunch) {
        lunch = doc.lunch;
      }
      order.update({username}, {dinner, lunch, year, month}, function(err, doc) {
        if (err) {
          res.send(500);
          req.session.error = '网络异常错误';
        }
        if (doc) {
          console.log('用户数据更新成功');
          res.send(200);
        }
      });
    }
  });
});

//查询个人订餐情况
router.get('/search', function(req, res, next) {
  if (!req.session.user) {
    req.session.error = '请先登录';
    return res.redirect("/login");
  }

  var order = global.dbHandle.getModel('order');
  var username = req.session.user.username;
  order.findOne({username}, function(err, doc) {
    console.log(doc.lunch + '*******' + doc.dinner + '========' + doc.year + '-------' + doc.month);
    return res.render('search', {
      username: username,
      lunch: doc.lunch,
      dinner: doc.dinner,
      year: doc.year,
      month: doc.month
    });
  });
});

//查询系统人员情况
router.get('/searchPeople', function(req, res, next) {
  if (!req.session.user) {
    req.session.error = '请先登录';
    return res.redirect("/login");
  }

  var order = global.dbHandle.getModel('order');
  var username = req.session.user.username;
  var peopleArr = [];
  order.find(function(err, doc) {
    console.log('--------' + err);
    if (err) {
      res.send(500);
      req.session.error = '网络异常错误';
    } else {
      for (var i = 0; i < doc.length; i++) {
        var temp = doc[i];
        var people = {
          username: temp.username,
          password: temp.password,
          role: temp.role
        };
        peopleArr.push(people);
      }

      console.log('查询人员信息:' + JSON.stringify(doc));
      return res.render('searchPeople', {peopleArr: peopleArr, peopleArrStr: JSON.stringify(doc)});
    }
  });
});

//删除用户
router.get('/deletePeople', function(req, res, next) {
  if (!req.session.user) {
    req.session.error = '请先登录';
    return res.redirect("/login");
  } else {
    if (req.session.user.username != 'admin') {
      req.session.error = '不是管理员, 请管理员登陆';
      return res.redirect("/login");
    } else {
      var username = req.query.username;
      console.log('***********' + username);

      var order = global.dbHandle.getModel('order');
      order.remove({username: username}, function(err, doc) {
        console.log('-------------' + doc);
        if (err) {
          res.send(500);
          req.session.error = '网络异常错误';
        } else {
          console.log('删除成功');
          return res.redirect("/searchPeople");
        }
      });
    }
  }
});

//退出系统
router.get("/logout", function(req, res) {
  req.session.user = null;
  req.session.error = null;
  res.redirect('/');
});

module.exports = router;
