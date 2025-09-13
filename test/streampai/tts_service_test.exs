defmodule Streampai.TtsServiceTest do
  use Streampai.DataCase, async: true

  alias Streampai.TtsService

  describe "get_or_generate_tts/2" do
    test "generates mock TTS path for new message" do
      message = "Hello, thank you for the donation!"
      voice = "default"

      assert {:ok, file_path} = TtsService.get_or_generate_tts(message, voice)
      assert String.starts_with?(file_path, "/tts/")
      assert String.ends_with?(file_path, ".mp3")
    end

    test "returns same path for same message and voice (consistent hashing)" do
      message = "Thank you so much!"
      voice = "cheerful"

      # Generate first time
      assert {:ok, file_path1} = TtsService.get_or_generate_tts(message, voice)

      # Generate second time - should return same path due to consistent hashing
      assert {:ok, file_path2} = TtsService.get_or_generate_tts(message, voice)
      assert file_path1 == file_path2
    end

    test "generates different paths for different voices" do
      message = "Thank you!"

      assert {:ok, file_path1} = TtsService.get_or_generate_tts(message, "default")
      assert {:ok, file_path2} = TtsService.get_or_generate_tts(message, "robotic")

      assert file_path1 != file_path2
    end

    test "generates different paths for different messages" do
      voice = "default"

      assert {:ok, file_path1} = TtsService.get_or_generate_tts("Hello!", voice)
      assert {:ok, file_path2} = TtsService.get_or_generate_tts("Goodbye!", voice)

      assert file_path1 != file_path2
    end

    test "returns error for empty message" do
      assert {:error, :empty_message} = TtsService.get_or_generate_tts("", "default")
      assert {:error, :empty_message} = TtsService.get_or_generate_tts(nil, "default")
    end
  end

  describe "generate_content_hash/2" do
    test "generates consistent hash for same inputs" do
      hash1 = TtsService.generate_content_hash("Hello", "default")
      hash2 = TtsService.generate_content_hash("Hello", "default")

      assert hash1 == hash2
      assert is_binary(hash1)
      # SHA256 hex string length
      assert String.length(hash1) == 64
    end

    test "generates different hashes for different inputs" do
      hash1 = TtsService.generate_content_hash("Hello", "default")
      hash2 = TtsService.generate_content_hash("Hello", "robotic")
      hash3 = TtsService.generate_content_hash("Goodbye", "default")

      assert hash1 != hash2
      assert hash1 != hash3
      assert hash2 != hash3
    end
  end

  describe "get_tts_public_url/1" do
    test "returns the path as-is for mock implementation" do
      file_path = "/tts/abc123.mp3"
      url = TtsService.get_tts_public_url(file_path)

      assert url == "/tts/abc123.mp3"
    end

    test "returns nil for nil input" do
      assert TtsService.get_tts_public_url(nil) == nil
    end
  end
end
