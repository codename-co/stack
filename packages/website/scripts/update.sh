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

update_stars() {
  file=$1
  name=$2
  stars=$3
  sed -i '' "s/^stars: .*/stars: $stars/" $file
}

# get_latest_repo_info "https://github.com/langgenius/dify"

# for each stack in the hub/* directories, read and parse their stack.yaml and display the name and version
for stack in hub/*/stack.yaml; do
  name=$(grep '^name:' $stack | awk -F': ' '{print $2}')
  version=$(grep '^version:' $stack | awk -F': ' '{print $2}')
  repository=$(grep '^repository:' $stack | awk -F': ' '{print $2}')
  current_stars=$(grep '^stars:' $stack | awk -F': ' '{print $2}')
  latest_version=$(get_repo_version $repository)
  stars=$(get_latest_repo_info $repository | jq -r '.stargazerCount')
  if [ "$version" != "$latest_version" ]; then
    echo "⬆️ $name · update from $version to $latest_version"
  fi
  if [ "$current_stars" != "$stars" ]; then
    if [ "$stars" -gt "$current_stars" ]; then
      echo "⭐$name · stars from $current_stars to $stars"
      update_stars $stack $name $stars
    fi
  fi
  # echo "$name: $version ($repository)"
  # echo $(get_repo_version $repository)
done
