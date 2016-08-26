module.exports = {
  order: {
    username:{type:String, required:true},
    password:{type:String, required:true},
    role:{type:String, required:true},
    lunch:{type:Array, required:false},
    dinner:{type:Array, required:false},
    year:{type:String, required:false},
    month:{type:String, required:false},
  }
};
