const i=t=>t==null||isNaN(t)?"0,00 ₺":`${new Intl.NumberFormat("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2}).format(t)} ₺`;export{i as f};
