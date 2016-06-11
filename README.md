# Ship

Awesome.


Create SSH Key
```
cd PROJECT_ROOT_FOLDER
mkdir -p config/.ssh
ssh-keygen config/.ssh/id_rsa
ssh-keyscan -p 10022 -H git.schmid.digital >> config/.ssh/known_hosts
cat config/.ssh/id_rsa.pub
```

Copy Key and add to Gitlab Project.
1. Open Project
2. Go to Settings
3. Choose "Deploy Keys"
4. Add Key
5. Paste content of id_rsa.pub