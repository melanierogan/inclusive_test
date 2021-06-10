const core = require('@actions/core');
const github = require('@actions/github');
const unfriendlyWords = [
	'banana',
];

const run = async () => {
	try {
		console.log('START OF TRY');
		const token = core.getInput('github_token');
		const octokit = new github.getOctokit(token);
		console.log('GOT OCTOKIT AND GITHUB CONTEXT SHOULD BE ABOVE THIS');
		const { repo, payload } = github.context;
		const owner = payload.repository.owner.login;
		const pull_number = payload.number;
		const repoName = repo.repo;

		const files = await octokit.rest.pulls.listFiles({
			owner: owner,
			repo: repoName,
			pull_number: pull_number,
		});

		const checkCommit = files.data[0].patch.split('\n');
		console.log(checkCommit, '<<< WHAT IS IN THIS COMMIT');
		const onlyAddedLines = line => {
			return line.startsWith('+');
		};
		const removeFirstPlus = line => {
			return line.substring(1);
		};
		const extractBadWords = (ExtractedBadWordsArray, line) => {
			for (const unfriendlyWord of unfriendlyWords) {
				if (line.includes(unfriendlyWord)) {
					ExtractedBadWordsArray.push({
						word: unfriendlyWord,
						line: line,
						index: line.indexOf(unfriendlyWord),
						status: true,
						count: ExtractedBadWordsArray.length,
					});
				}
			}
			return ExtractedBadWordsArray;
		};
		console.log(extractBadWords, '<<< WHAT ARE THE BAD WORDS THAT WERE FOUND');

		const result = checkCommit
			.filter(onlyAddedLines)
			.map(removeFirstPlus)
			.reduce(extractBadWords, []);

		const wordsFound = result.map(function(el) {
			return el.word;
		});

		const isUnfriendlyComment = `💔 This PR contains some non inclusive or unfriendly terms.
				The following words were found: ${wordsFound}`;

		const newComment = await octokit.rest.issues.createComment({
			owner: owner,
			repo: repoName,
			issue_number: pull_number,
			body: isUnfriendlyComment,
		});
		if (result[0].status) {
			console.log('WE OUT HERE');
			newComment;
		}

		return 'run complete';
	} catch (error) {
		core.setFailed(error.message);
	}
};

run();
