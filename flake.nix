{
  description = "Project starter";
  inputs = {
    nixpkgs.url = "nixpkgs/nixpkgs-unstable";
    flake-parts.url = "github:hercules-ci/flake-parts";
    nix2container.url = "github:nlewo/nix2container";
  };

  outputs =
    { flake-parts, nixpkgs, ... }@inputs:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = [ "x86_64-linux" ];
      perSystem =
        { config, system, ... }:
        let
          pkgs = import nixpkgs { inherit system; };
        in
        {
          devShells.default = pkgs.mkShell {
            packages = with pkgs; [
              elixir
              # elixir_1_19
              elixir-ls
              lexical
              next-ls
              erlang_28
              inotify-tools
              just
              nodejs
              bun
              # dbmate
              # telepresence2
              # cilium-cli
              # kubernetes-helm
            ];
          };
        };
    };
}
