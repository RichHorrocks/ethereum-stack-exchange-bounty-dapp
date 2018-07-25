# Vyper SafeMath implementation.

#
# Multiplies two numbers, throws on overflow.
#
@private
@constant
def mul(_a : uint256, _b : uint256) -> uint256:
    # Gas optimization: this is cheaper than asserting 'a' not being zero,
    # but the benefit is lost if 'b' is also tested.
    if _a == 0:
        return 0

    c : uint256 = _a * _b
    assert c / _a == _b

    return c

#
#  Integer division of two numbers, truncating the quotient.
#
@private
@constant
def div(_a : uint256, _b : uint256) -> uint256:
    assert _b > 0
    c : uint256 = _a / _b
    assert _a == _b * c + _a % _b

    return _a / _b

#
# Subtracts two numbers, throws on overflow (i.e. if subtrahend is greater
# than minuend).
#
@private
@constant
def sub(_a : uint256, _b : uint256) -> uint256:
    assert _b <= _a

    return _a - _b

#
# Adds two numbers, throws on overflow.
#
@private
@constant
def add(_a : uint256, _b : uint256) -> uint256:
    c : uint256 = _a + _b
    assert c >= _a

    return c
    
