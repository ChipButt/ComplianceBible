// Option C compact layout for document evidence cards.
(function(){
  if(window.__documentOptionCLayout)return;
  window.__documentOptionCLayout=true;

  function apply(){
    document.querySelectorAll('.evidenceCard').forEach(function(card){
      card.classList.add('evidenceOptionC');
      var status=card.querySelector('.evidenceStatus');
      if(status&&status.textContent.indexOf('Upload or take')===0)status.textContent='Evidence + expiry/no-expiry required';
      var thumb=card.querySelector('.evidenceThumb');
      if(thumb&&!thumb.getAttribute('aria-label'))thumb.setAttribute('aria-label','View uploaded document');
    });

    document.querySelectorAll('.docItem').forEach(function(item){
      if(item.querySelector('.evidenceOptionC'))item.classList.add('docItemOptionC');
    });
  }

  var style=document.createElement('style');
  style.textContent=`
    .docItemOptionC{
      gap:12px!important;
      align-items:stretch!important;
    }

    .docItemOptionC .evidenceOptionC{
      width:100%!important;
      box-sizing:border-box!important;
      display:grid!important;
      grid-template-columns:76px 1fr!important;
      grid-template-areas:
        "thumb actions"
        "thumb meta"
        "status status"!important;
      gap:10px 12px!important;
      align-items:center!important;
      justify-items:stretch!important;
      margin-top:10px!important;
      padding:10px!important;
      border-radius:18px!important;
      background:rgba(255,255,255,.035)!important;
      border:1px solid rgba(176,145,74,.22)!important;
    }

    .evidenceOptionC .evidenceThumb{
      grid-area:thumb!important;
      width:72px!important;
      height:96px!important;
      margin:0!important;
      justify-self:center!important;
      align-self:center!important;
      border-radius:12px!important;
      font-size:12px!important;
      line-height:1.15!important;
    }

    .evidenceOptionC .evidenceThumb.empty{
      width:72px!important;
      height:96px!important;
      padding:8px!important;
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
    }

    .evidenceOptionC .evidenceChoices{
      grid-area:actions!important;
      display:grid!important;
      grid-template-columns:1fr 1fr!important;
      gap:8px!important;
      width:100%!important;
      margin:0!important;
    }

    .evidenceOptionC .evidenceChoices label{
      min-height:42px!important;
      border-radius:12px!important;
      font-size:14px!important;
      padding:0 8px!important;
      white-space:nowrap!important;
    }

    .evidenceOptionC > label.checkline,
    .evidenceOptionC > label:not(.evidenceChoiceBtn):not(:has(input[type=file])){
      margin:0!important;
    }

    .evidenceOptionC > label.checkline{
      grid-area:meta!important;
      display:flex!important;
      align-items:center!important;
      gap:8px!important;
      min-height:40px!important;
      font-size:13px!important;
      color:#fff8ea!important;
      background:rgba(255,255,255,.04)!important;
      border:1px solid rgba(255,255,255,.08)!important;
      border-radius:12px!important;
      padding:8px!important;
      width:calc(50% - 4px)!important;
      justify-self:start!important;
    }

    .evidenceOptionC > label:has(input[data-ev-expiry]){
      grid-area:meta!important;
      display:grid!important;
      grid-template-columns:auto 1fr!important;
      align-items:center!important;
      gap:8px!important;
      min-height:40px!important;
      font-size:13px!important;
      color:#fff8ea!important;
      background:rgba(255,255,255,.04)!important;
      border:1px solid rgba(255,255,255,.08)!important;
      border-radius:12px!important;
      padding:8px!important;
      width:calc(50% - 4px)!important;
      justify-self:end!important;
    }

    .evidenceOptionC input[data-ev-expiry]{
      min-height:34px!important;
      height:34px!important;
      padding:4px 8px!important;
      font-size:13px!important;
      border-radius:9px!important;
    }

    .evidenceOptionC input[type=checkbox]{
      width:22px!important;
      height:22px!important;
      min-height:22px!important;
      padding:0!important;
    }

    .evidenceOptionC .evidenceStatus{
      grid-area:status!important;
      margin:0!important;
      padding:8px 10px!important;
      border-radius:12px!important;
      background:rgba(176,145,74,.08)!important;
      color:#d0ad58!important;
      font-size:13px!important;
      line-height:1.2!important;
      text-align:center!important;
    }

    @media(max-width:390px){
      .docItemOptionC .evidenceOptionC{
        grid-template-columns:64px 1fr!important;
        gap:8px!important;
      }
      .evidenceOptionC .evidenceThumb,
      .evidenceOptionC .evidenceThumb.empty{
        width:62px!important;
        height:82px!important;
      }
      .evidenceOptionC .evidenceChoices label{
        font-size:12px!important;
      }
      .evidenceOptionC > label.checkline,
      .evidenceOptionC > label:has(input[data-ev-expiry]){
        width:100%!important;
        justify-self:stretch!important;
      }
      .evidenceOptionC > label:has(input[data-ev-expiry]){
        margin-top:48px!important;
      }
    }
  `;
  document.head.appendChild(style);

  if(typeof bind==='function'&&!bind.__documentOptionCLayout){
    var old=bind;
    bind=function(){old();apply();};
    bind.__documentOptionCLayout=true;
  }
  document.addEventListener('click',function(){setTimeout(apply,0)},true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();
})();