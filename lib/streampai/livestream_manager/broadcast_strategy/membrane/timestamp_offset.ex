defmodule Streampai.LivestreamManager.BroadcastStrategy.Membrane.TimestampOffset do
  @moduledoc """
  A simple Membrane filter that resets timestamps on all pads to start from zero.

  When a dynamically-added RTMP.Sink joins mid-stream, the first buffers have
  timestamps seconds into the stream (e.g. DTS=7s). The RTMP.Sink only resets
  video timestamps, leaving audio at the original values. This creates an A/V
  timestamp mismatch that causes black screens on platforms.

  This filter captures the first DTS (or PTS) on each pad and subtracts it from
  all subsequent buffers, ensuring both audio and video start from zero.

  Usage: place between Tee.Parallel and RTMP.Sink for each dynamically-added output.
  Set `reset_timestamps: false` on the RTMP.Sink when using this filter.
  """
  use Membrane.Filter, flow_control_hints?: false

  def_input_pad(:input,
    availability: :on_request,
    flow_control: :auto,
    accepted_format: _any
  )

  def_output_pad(:output,
    availability: :on_request,
    flow_control: :auto,
    accepted_format: _any
  )

  @impl true
  def handle_init(_ctx, _opts) do
    {[], %{base_offsets: %{}}}
  end

  @impl true
  def handle_stream_format(pad, stream_format, _ctx, state) do
    out_pad = corresponding_output(pad)
    {[stream_format: {out_pad, stream_format}], state}
  end

  @impl true
  def handle_buffer(pad, buffer, _ctx, state) do
    base_ts = buffer.dts || buffer.pts

    {offset, state} =
      case Map.fetch(state.base_offsets, pad) do
        {:ok, existing} ->
          {existing, state}

        :error ->
          {base_ts, put_in(state, [:base_offsets, pad], base_ts)}
      end

    adjusted_buffer = %{
      buffer
      | dts: if(buffer.dts, do: buffer.dts - offset),
        pts: if(buffer.pts, do: buffer.pts - offset)
    }

    out_pad = corresponding_output(pad)
    {[buffer: {out_pad, adjusted_buffer}], state}
  end

  @impl true
  def handle_end_of_stream(pad, _ctx, state) do
    out_pad = corresponding_output(pad)
    {[end_of_stream: out_pad], state}
  end

  defp corresponding_output(Pad.ref(:input, id)), do: Pad.ref(:output, id)
end
