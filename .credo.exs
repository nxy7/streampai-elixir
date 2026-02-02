alias Credo.Check.Readability.ModuleDoc

%{
  configs: [
    %{
      name: "default",
      files: %{
        included: [
          "lib/",
          "src/",
          "test/",
          "web/",
          "apps/*/lib/",
          "apps/*/src/",
          "apps/*/test/",
          "apps/*/web/"
        ],
        excluded: [~r"/_build/", ~r"/deps/", ~r"/node_modules/"]
      },
      plugins: [],
      requires: [],
      strict: true,
      parse_timeout: 5000,
      color: true,
      checks: %{
        enabled: [
          {Credo.Check.Warning.MissedMetadataKeyInLoggerConfig,
           [
             metadata_keys: [
               # Request tracking
               :request_id,
               :error_id,
               :user_id,
               :path,
               :duration,
               :method,
               :remote_ip,
               # Stream management
               :livestream_id,
               :stream_id,
               :component,
               :chat_id,
               :input_status,
               :alert_id,
               :stream_event_id,
               :display_time,
               # API response handling
               :status,
               :body,
               :reason,
               :error,
               :error_type,
               :stacktrace,
               # TTS processing
               :voice,
               :voice_name,
               :audio_size,
               :message_length,
               :hash,
               :has_tts,
               # Webhook/notification handling
               :webhook_id,
               :event_type,
               :event_id,
               :retry_after,
               :attempt,
               # Donation processing
               :donor_name,
               :amount,
               # Email/job processing
               :type,
               :opts,
               # File operations
               :size
             ]
           ]}
        ],
        disabled: [
          {Credo.Check.Design.TagTODO, false},
          {Credo.Check.Design.TagFIXME, false},
          {ModuleDoc, false},
          {Credo.Check.Consistency.MultiAliasImportRequireUse, false},
          {Credo.Check.Consistency.ParameterPatternMatching, false},
          {Credo.Check.Design.AliasUsage, false},
          {Credo.Check.Readability.AliasOrder, false},
          {Credo.Check.Readability.BlockPipe, false},
          {Credo.Check.Readability.LargeNumbers, false},
          {ModuleDoc, false},
          {Credo.Check.Readability.MultiAlias, false},
          {Credo.Check.Readability.OneArityFunctionInPipe, false},
          {Credo.Check.Readability.ParenthesesOnZeroArityDefs, false},
          {Credo.Check.Readability.PipeIntoAnonymousFunctions, false},
          {Credo.Check.Readability.PreferImplicitTry, false},
          {Credo.Check.Readability.SinglePipe, false},
          {Credo.Check.Readability.StrictModuleLayout, false},
          {Credo.Check.Readability.StringSigils, false},
          {Credo.Check.Readability.UnnecessaryAliasExpansion, false},
          {Credo.Check.Readability.WithSingleClause, false},
          {Credo.Check.Refactor.CaseTrivialMatches, false},
          {Credo.Check.Refactor.CondStatements, false},
          {Credo.Check.Refactor.FilterCount, false},
          {Credo.Check.Refactor.MapInto, false},
          {Credo.Check.Refactor.MapJoin, false},
          {Credo.Check.Refactor.NegatedConditionsInUnless, false},
          {Credo.Check.Refactor.NegatedConditionsWithElse, false},
          {Credo.Check.Refactor.PipeChainStart, false},
          {Credo.Check.Refactor.RedundantWithClauseResult, false},
          {Credo.Check.Refactor.UnlessWithElse, false},
          {Credo.Check.Refactor.WithClauses, false}
        ]
      }
    }
  ]
}
