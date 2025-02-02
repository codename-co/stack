#!/usr/bin/env bash

# check gh is installed
if ! command -v gh &> /dev/null
then
    echo "⚠ gh could not be found"
    echo "  Please install it from https://cli.github.com/"
    exit
fi

get_latest_repo_info() {
  repo=$1
  gh repo view $repo --json nameWithOwner,stargazerCount,latestRelease
}

get_repo_version() {
  repo=$1
  gh repo view $repo --json latestRelease | jq -r '.latestRelease.tagName' | sed 's/v//' | sed 's/release-//'
}

# get_latest_repo_info "https://github.com/langgenius/dify"

# for each stack in the hub/* directories, read and parse their stack.yaml and display the name and version
for stack in hub/*/stack.yaml; do
  name=$(grep '^name:' $stack | awk -F': ' '{print $2}')
  version=$(grep '^version:' $stack | awk -F': ' '{print $2}')
  repository=$(grep '^repository:' $stack | awk -F': ' '{print $2}')
  latest_version=$(get_repo_version $repository)
  if [ "$version" != "$latest_version" ]; then
    echo "Update $name from $version to $latest_version"
  fi
  # echo "$name: $version ($repository)"
  # echo $(get_repo_version $repository)
done
