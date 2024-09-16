function removeAccent(str) {
    return str.replace(/[AÁÀÃÂ]/g,'A').replace(/[áàâã]/g,'a').replace(/[Ç]/g,'C').replace(/[ç]/g,'c').replace(/[ÉÈÊ]/g,'E').replace(/[éèê]/g,'e').replace(/[ÍÌ]/g,'I').replace(/[ìí]/g,'i').replace(/[ÓÒÕÔ]/g,'O').replace(/[óòõô]/g,'o').replace(/[ÚÙ]/g,'U').replace(/[úù]/g,'u')
}

function removeWhiteSpace(str) {
    return str.replace(/ /g,'').trim()
}

export { removeAccent, removeWhiteSpace }
