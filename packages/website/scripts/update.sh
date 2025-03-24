#!/usr/bin/env bash

mode="$1"
echo "Mode: $mode"

# check gh is installed
if ! command -v gh &> /dev/null
then
    echo "⚠ gh could not be found"
    echo "  Please install it from https://cli.github.com/"
    exit
fi

# check numfmt is installed
if ! command -v numfmt &> /dev/null
then
    echo "⚠ numfmt could not be found"
    echo "  Please install it:  brew install coreutils"
    exit
fi

# check jq is installed
if ! command -v jq &> /dev/null
then
    echo "⚠ jq could not be found"
    echo "  Please install it:  brew install jq"
    exit
fi

dockersize() {
  docker_image="$1"
  docker manifest inspect -v "$docker_image" | jq -c 'if type == "array" then .[] else . end' |  jq -r '[ ( .Descriptor.platform | [ .os, .architecture, .variant, ."os.version" ] | del(..|nulls) | join("/") ), ( [ ( .OCIManifest // .SchemaV2Manifest ).layers[].size ] | add ) ] | join(" ")' | numfmt --to iec --format '%.2f' --field 2 | sort | column -t
}

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
  stars=$2
  # round to nearest hundred only if greater than 1000
  if [ "$stars" -ge 1000 ]; then
    stars=$(( stars / 100 * 100 ))
  fi
  sed -i '' "s/^stars: .*/stars: $stars/" $file
}

# get_latest_repo_info "https://github.com/langgenius/dify"

# for each stack in the hub/* directories, read and parse their stack.yaml and display the name and version
# Function to process a single stack
process_stack() {
  local stack=$1
  local slug=$(grep '^slug:' $stack | awk -F': ' '{print $2}')
  local version=$(grep '^version:' $stack | awk -F': ' '{print $2}')
  local repository=$(grep '^repository:' $stack | awk -F': ' '{print $2}')
  local current_stars=$(grep '^stars:' $stack | awk -F': ' '{print $2}')
  local latest_version=$(get_repo_version $repository)
  local stars=$(get_latest_repo_info $repository | jq -r '.stargazerCount')

  if [ "$mode" == "version" ]; then
    if [ "$version" != "$latest_version" ]; then
      echo "⬆️ $slug · update from $version to $latest_version"
      # TODO:
    fi
  fi

  if [ "$mode" == "stars" ]; then
    if [ "$current_stars" != "$stars" ]; then
      if [ "$stars" -gt "$current_stars" ]; then
        echo "⭐$slug · stars from $current_stars to $stars"
        update_stars $stack $stars
      fi
    fi
  fi
}

# Maximum number of parallel jobs
MAX_JOBS=5
count=0

# Process all stacks in parallel with a limit on concurrency
for stack in hub/*/stack.yaml; do
  process_stack "$stack" &

  # Limit the number of concurrent jobs
  ((count=count+1))
  if [ $count -ge $MAX_JOBS ]; then
    wait -n  # Wait for any child to finish
    ((count=count-1))
  fi
done

# Wait for remaining jobs to finish
wait
done
