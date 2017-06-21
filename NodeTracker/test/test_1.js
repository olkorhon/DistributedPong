describe('Case1', function () {
	it('test1', function (done) {
		done();
	});
	it('test2', function (done) {
		done();
	});
	it('test3', function (done) {
		done();
	});
	it('test4', function (done) {
		done(new Error('This test does not pass'));
	});
});