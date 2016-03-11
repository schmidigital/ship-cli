#!/bin/bash
set -e

export ROOT=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

# Script to workaround docker-machine/boot2docker OSX host volume issues: https://github.com/docker-library/mysql/issues/99

echo '** Working around permission errors locally by making sure that "$USER" uses the same uid and gid as the host volume'

# Setup User/Group Permissions
TARGET_GID=$(stat -c "%g" ${FOLDER})
TARGET_GROUP=$(getent group ${TARGET_GID} | cut -d: -f1)

echo '-- Delete group ${TARGET_GROUP} this id ${TARGET_GID} (if available)'
echo $TARGET_GID
echo $TARGET_GROUP
groupdel $TARGET_GROUP || true

echo '-- Setting mysql group to use gid ${TARGET_GID}'
groupmod -o -g $TARGET_GID $USER || true
groupadd -o -g $TARGET_GID $USER || true


# User
TARGET_UID=$(stat -c "%u" ${FOLDER})
TARGET_USER=$(getent passwd "${TARGET_UID}" | cut -d: -f1)

echo '-- Delete user $TARGET_USER with id ${TARGET_UID} (if available)'
userdel $TARGET_USER || true

echo '-- Setting mysql user to use uid ${TARGET_UID}'
usermod -o -u $TARGET_UID $USER || true
useradd -u $TARGET_UID -g $USER $USER || true


echo
echo '* Starting Entrypoint'
echo $ENTRYPOINT

$ENTRYPOINT
