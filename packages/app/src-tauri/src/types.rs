/// Enum representing the different flavors of software stacks.
#[derive(Debug)]
pub enum Flavor {
    HelmChart,
    DockerCompose,
    DockerService,
    NodePackage,
    GoPackage,
    StaticWebsite,
}
