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
      systems = [ "x86_64-linux" "aarch64-darwin" "x86_64-darwin" ];
      perSystem =
        { config, system, ... }:
        let
          pkgs = import nixpkgs { inherit system; };
          isLinux = pkgs.stdenv.isLinux;
        in
        {
          devShells.default = pkgs.mkShell {
            packages = with pkgs; [
              ffmpeg
              # elixir
              elixir_1_19
              elixir-ls
              lexical
              next-ls
              erlang_28
              just
              nodejs
              bun
              protobuf
              protoc-gen-elixir
              # dbmate
              # telepresence2
              # cilium-cli
              # kubernetes-helm
            ] ++ pkgs.lib.optionals isLinux [
              inotify-tools
            ];
          };
        };
    };
}
