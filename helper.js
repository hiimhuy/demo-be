const base64url = str =>{
  return btoa(str).replace(/\+/,'-').replace(/\//,'_').replace(/\=/,'')
}

module.exports={base64url}