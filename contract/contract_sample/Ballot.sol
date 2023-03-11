// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;
/// @title Voting with delegation.
contract Ballot {
    // This declares a new complex type which will
    // be used for variables later.
    // It will represent a single voter.
    struct Voter {
        uint weight; // weight is accumulated by delegation
        bool voted;  // if true, that person already voted
        address delegate; // person delegated to
        uint vote;   // index of the voted proposal
    }

    // This is a type for a single proposal.
    struct Proposal {
        string name;   // short name (up to 32 bytes)
        uint voteCount; // number of accumulated votes
    }

    address public s_chairperson;

    // This declares a state variable that
    // stores a `Voter` struct for each possible address.
    mapping(address => Voter) public s_voters;

    // A dynamically-sized array of `Proposal` structs.
    Proposal[] public s_proposals;

    /// Create a new ballot to choose one of `proposalNames`.
//NOTSUPPORTEDARRAY       constructor(bytes32[] memory proposalNames) {
    constructor() {
        s_chairperson = msg.sender;
        s_voters[s_chairperson].weight = 1;

        // For each of the provided proposal names,
        // create a new proposal object and add it
        // to the end of the array.
//NOTSUPPORTEDARRAY       for (uint i = 0; i < proposalNames.length; i++) {
//NOTSUPPORTEDARRAY           // `Proposal({...})` creates a temporary
//NOTSUPPORTEDARRAY           // Proposal object and `s_proposals.push(...)`
//NOTSUPPORTEDARRAY           // appends it to the end of `s_proposals`.
//NOTSUPPORTEDARRAY           s_proposals.push(Proposal({
//NOTSUPPORTEDARRAY               name: proposalNames[i],
//NOTSUPPORTEDARRAY               voteCount: 0
//NOTSUPPORTEDARRAY           }));
//NOTSUPPORTEDARRAY       }
    }


    function addProposal(string calldata _proposal) external {
      require( msg.sender == s_chairperson, "Only chairperson can add proposal.");
      s_proposals.push(Proposal({
          name: _proposal,
          voteCount: 0
      }));
    }
    
    function getProposal(uint16 _id) external view returns (string memory) {
        return s_proposals[_id].name;
    }

    function getEthAddr() external view returns (address) {
        address addr = msg.sender;
        return addr;
    }

    // Give `voter` the right to vote on this ballot.
    // May only be called by `s_chairperson`.
    function giveRightToVote(address _voter) external {
        // If the first argument of `require` evaluates
        // to `false`, execution terminates and all
        // changes to the state and to Ether balances
        // are reverted.
        // This used to consume all gas in old EVM versions, but
        // not anymore.
        // It is often a good idea to use `require` to check if
        // functions are called correctly.
        // As a second argument, you can also provide an
        // explanation about what went wrong.
        require( msg.sender == s_chairperson, "Only chairperson can give right to vote.");
        require( !s_voters[_voter].voted, "The voter already voted.");
        require(s_voters[_voter].weight == 0);
        s_voters[_voter].weight = 1;
    }

    /// Delegate your vote to the voter `to`.
    function delegate(address _to_voter) external {
        // assigns reference
        Voter storage sender = s_voters[msg.sender];
        require(sender.weight != 0, "You have no right to vote");
        require(!sender.voted, "You already voted.");

        require(_to_voter != msg.sender, "Self-delegation is disallowed.");

        // Forward the delegation as long as
        // `_to_voter` also delegated.
        // In general, such loops are very dangerous,
        // because if they run too long, they might
        // need more gas than is available in a block.
        // In this case, the delegation will not be executed,
        // but in other situations, such loops might
        // cause a contract to get "stuck" completely.
        while (s_voters[_to_voter].delegate != address(0)) {
            _to_voter = s_voters[_to_voter].delegate;

            // We found a loop in the delegation, not allowed.
            require(_to_voter != msg.sender, "Found loop in delegation.");
        }

        Voter storage delegate_ = s_voters[_to_voter];

        // Voters cannot delegate to accounts that cannot vote.
        require(delegate_.weight >= 1);

        // Since `sender` is a reference, this
        // modifies `s_voters[msg.sender]`.
        sender.voted = true;
        sender.delegate = _to_voter;

        if (delegate_.voted) {
            // If the delegate already voted,
            // directly add to the number of votes
            s_proposals[delegate_.vote].voteCount += sender.weight;
        } else {
            // If the delegate did not vote yet,
            // add to her weight.
            delegate_.weight += sender.weight;
        }
    }

    /// Give your vote (including votes delegated to you)
    /// to proposal `s_proposals[proposal_id].name`.
    function vote(uint _proposal_id) external {
        Voter storage sender = s_voters[msg.sender];
        require(sender.weight != 0, "Has no right to vote");
        require(!sender.voted, "Already voted.");
        sender.voted = true;
        sender.vote = _proposal_id;

        // If `_proposal_id` is out of the range of the array,
        // this will throw automatically and revert all
        // changes.
        s_proposals[_proposal_id].voteCount += sender.weight;
    }

    /// @dev Computes the winning proposal taking all
    /// previous votes into account.
    function winningProposal() public view returns (uint winningProposal_) {
        uint winningVoteCount = 0;
        for (uint p = 0; p < s_proposals.length; p++) {
            if (s_proposals[p].voteCount > winningVoteCount) {
                winningVoteCount = s_proposals[p].voteCount;
                winningProposal_ = p;
            }
        }
    }

    // Calls winningProposal() function to get the index
    // of the winner contained in the s_proposals array and then
    // returns the name of the winner
    function winnerName() external view returns (string memory winnerName_) {
        winnerName_ = s_proposals[winningProposal()].name;
    }
}
