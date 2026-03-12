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
      systems = [
        "x86_64-linux"
        "aarch64-darwin"
        "x86_64-darwin"
      ];
      perSystem =
        { system, ... }:
        let
          pkgs = import nixpkgs { inherit system; };
          isLinux = pkgs.stdenv.isLinux;
        in
        {
          devShells.default = pkgs.mkShell {
            packages =
              with pkgs;
              [
                ffmpeg
                elixir_1_19
                erlang_28
                just
                nodejs
                bun
                protobuf
                protoc-gen-elixir
                lefthook
                cmake
              ]
              ++ pkgs.lib.optionals isLinux [
                inotify-tools
              ]
              ++ pkgs.lib.optionals pkgs.stdenv.isDarwin [
                pkgs.llvmPackages.openmp
              ];

            # LibTorch expects libomp at Homebrew path; point it to Nix's copy
            env = pkgs.lib.optionalAttrs pkgs.stdenv.isDarwin {
              DYLD_LIBRARY_PATH = "${pkgs.llvmPackages.openmp}/lib";
            };
          };
        };
    };
}
