// Final profile save handler: admin-safe, saves fields and returns to the user's profile page.
(function(){
  function byId(id){return document.getElementById(id)}
  function val(id,fallback=''){var el=byId(id);return el?el.value:fallback}
  function num(id,fallback=0){var n=Number(val(id,fallback));return Number.isFinite(n)?n:fallback}
  function checked(id,fallback=false){var el=byId(id);return el?!!el.checked:fallback}
  function currentProfileUser(){return (state.users||[]).find(function(u){return u.id===state.profileUserId}) || (typeof profileUser==='function'?profileUser():null) || (typeof me==='function'?me():null)}
  window.saveProfileEdit=function(e){
    if(e)e.preventDefault();
    var u=currentProfileUser();
    if(!u)return alert('User profile could not be found.');
    var adminEdit=typeof can==='function' ? can('manageUsers') : false;
    var self=typeof me==='function' ? u.id===me().id : false;
    var canOwn=typeof can==='function' ? can('editOwnPersonal') : false;

    if(adminEdit){
      u.firstName=val('edit_firstName',u.firstName||'').trim();
      u.lastName=val('edit_lastName',u.lastName||'').trim();
      u.name=[u.firstName,u.lastName].filter(Boolean).join(' ') || u.name || 'Unknown';
      u.email=val('edit_email',u.email||'').trim();
      u.jobArea=val('edit_jobArea',u.jobArea||'');
      u.permissionSetId=val('edit_permissionSetId',u.permissionSetId||'staff');
      u.holidayAllowanceDays=num('edit_holidayAllowanceDays',Number(u.holidayAllowanceDays||0));
      u.holidayCarriedDays=num('edit_holidayCarriedDays',Number(u.holidayCarriedDays||0));
      u.holidayAdjustmentDays=num('edit_holidayAdjustmentDays',Number(u.holidayAdjustmentDays||0));
      u.payType=val('edit_payType',u.payType||'hourly');
      u.contractedHoursPerWeek=num('edit_contractedHoursPerWeek',Number(u.contractedHoursPerWeek||37.5));
      var wheelPay=byId('payWheelValue');
      if(wheelPay){
        var amount=Number(wheelPay.value||0);
        if(u.payType==='salary'){
          u.salaryAnnualAmount=amount;
          u.wage=amount;
        }else{
          u.wage=amount;
          u.salaryAnnualAmount=0;
        }
      }else{
        u.wage=num('edit_wage',Number(u.wage||0));
        u.salaryWeeklyAmount=num('edit_salaryWeeklyAmount',Number(u.salaryWeeklyAmount||0));
      }
    }

    if(adminEdit || (self&&canOwn)){
      u.nickname=val('edit_nickname',u.nickname||'').trim();
      u.dob=val('edit_dob',u.dob||'');
      u.address=val('edit_address',u.address||'').trim();
      u.mobile=val('edit_mobile',u.mobile||'').trim();
      u.pronouns=val('edit_pronouns',u.pronouns||'').trim();
      u.upcomingShiftAlerts=checked('edit_upcomingShiftAlerts',u.upcomingShiftAlerts!==false);
    }

    if(u.email && u.accountStatus==='no_email')u.accountStatus='uninvited';
    state.profileUserId=u.id;
    state.profilePanel='home';
    state.view='profile';
    if(typeof save==='function')save();
    if(typeof render==='function')render();
    setTimeout(function(){window.scrollTo(0,0);document.documentElement.scrollTop=0;document.body.scrollTop=0;},0);
    return false;
  };
  try{saveProfileEdit=window.saveProfileEdit}catch(e){}
})();

// Final pay wheel UI for Edit Profile.
(function(){
  function pad(n,len){return String(n).padStart(len,'0')}
  function opt(max,sel){var s='';for(var i=0;i<=max;i++)s+='<option value="'+i+'" '+(i===sel?'selected':'')+'>'+i+'</option>';return s}
  function readDigits(cls){return Array.from(document.querySelectorAll('.'+cls)).map(function(x){return x.value}).join('')}
  function updatePayWheel(){
    var type=document.getElementById('edit_payType')?.value||'hourly';
    var out=document.getElementById('payWheelValue');
    if(!out)return;
    if(type==='salary'){
      out.value=Number(readDigits('salaryDigit')||0);
    }else{
      out.value=Number(readDigits('hourPoundDigit')+'.'+readDigits('hourPenceDigit'));
    }
  }
  window.refreshPayWheel=function(){
    var type=document.getElementById('edit_payType')?.value||'hourly';
    document.getElementById('hourlyWheelWrap').style.display=type==='hourly'?'':'none';
    document.getElementById('salaryWheelWrap').style.display=type==='salary'?'':'none';
    updatePayWheel();
  };
  var old=window.renderProfileEdit||renderProfileEdit;
  window.renderProfileEdit=function(){
    old();
    var u=(state.users||[]).find(function(x){return x.id===state.profileUserId});
    if(!u)return;
    var typeEl=document.getElementById('edit_payType');
    if(!typeEl)return;
    var typeLabel=typeEl.closest('label');
    var oldWage=document.getElementById('edit_wage')?.closest('label');
    var oldSalary=document.getElementById('edit_salaryWeeklyAmount')?.closest('label') || document.getElementById('edit_salaryAnnualAmount')?.closest('label');
    var hourly=Number(u.wage||0);var hp=Math.floor(hourly);var pp=Math.round((hourly-hp)*100);
    var annual=Number(u.salaryAnnualAmount||u.wage||0);var salaryDigits=pad(Math.min(99999,Math.floor(annual)),5).split('').map(Number);
    var hpDigits=pad(Math.min(999,Math.floor(hp)),3).split('').map(Number);var ppDigits=pad(Math.min(99,pp),2).split('').map(Number);
    typeLabel.innerHTML='Pay Type<select id="edit_payType" onchange="refreshPayWheel()"><option value="hourly" '+((u.payType||'hourly')==='hourly'?'selected':'')+'>Hourly</option><option value="salary" '+(u.payType==='salary'?'selected':'')+'>Salary</option></select>';
    var html='<div class="payWheelPanel"><input type="hidden" id="payWheelValue"><div id="hourlyWheelWrap"><strong>Pay Rate</strong><div class="payWheelRow"><span>£</span><select class="hourPoundDigit">'+opt(9,hpDigits[0])+'</select><select class="hourPoundDigit">'+opt(9,hpDigits[1])+'</select><select class="hourPoundDigit">'+opt(9,hpDigits[2])+'</select><span>.</span><select class="hourPenceDigit">'+opt(9,ppDigits[0])+'</select><select class="hourPenceDigit">'+opt(9,ppDigits[1])+'</select></div></div><div id="salaryWheelWrap"><strong>Salary</strong><div class="payWheelRow"><span>£</span>'+salaryDigits.map(function(d){return '<select class="salaryDigit">'+opt(9,d)+'</select>'}).join('')+'</div></div></div>';
    typeLabel.insertAdjacentHTML('afterend',html);
    if(oldWage)oldWage.remove();
    if(oldSalary)oldSalary.remove();
    document.querySelectorAll('.payWheelPanel select').forEach(function(s){s.onchange=updatePayWheel});
    refreshPayWheel();
  };
  try{renderProfileEdit=window.renderProfileEdit}catch(e){}
})();

// Minute-boundary refresh for Home clock/countdown.
(function(){
  function delay(){var n=new Date();return 60000-(n.getSeconds()*1000+n.getMilliseconds())+50}
  function tick(){
    if((state.view==='home'||state.view==='clock')&&typeof renderHome==='function')renderHome();
    window.__homeMinuteRefresh=setTimeout(tick,delay());
  }
  clearTimeout(window.__homeMinuteRefresh);
  window.__homeMinuteRefresh=setTimeout(tick,delay());
})();
