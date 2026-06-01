use anchor_lang::prelude::*;

declare_id!("64g726xowh1knCHgZyVsCEcymutxoa4yBcaLTczVzzxQ");

#[program]
pub mod assignment_5 {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
