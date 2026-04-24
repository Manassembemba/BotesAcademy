      functions: {
        /**
         * Calls the `check_overdue_payments` stored procedure.
         */
        "check_overdue_payments": () => {
          return {
            rpc_name: "check_overdue_payments",
          };
        },
        /**
         * Records a manual payment for a course purchase.
         */
        record_manual_payment: (args: {
          p_user_id: string;
          p_course_id: string;
          p_amount: number;
          p_payment_method: string;
          p_admin_id: string;
        }) => Promise<any>;
      };
      /**
       * Calls the `validate_payment` stored procedure.
       */
      validate_payment: (args: { proof_id: string; admin_notes_text?: string }) => Promise<any>;
    };