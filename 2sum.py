def two_sum(nums, target):
    \"\"\"
    Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

    You may assume that each input would have exactly one solution, and you may not use the same element twice.

    Args:
        nums (list[int]): The input array of integers.
        target (int): The target sum.

    Returns:
        list[int]: A list containing the indices of the two numbers that add up to the target.
    \"\"\"
    num_map = {}
    for index, num in enumerate(nums):
        complement = target - num
        if complement in num_map:
            return [num_map[complement], index]
        num_map[num] = index

if __name__ == '__main__':
    nums = [2, 7, 11, 15]
    target = 9
    result = two_sum(nums, target)
    print(result)  # Output: [0, 1]

    nums = [3, 2, 4]
    target = 6
    result = two_sum(nums, target)
    print(result)  # Output: [1, 2]

    nums = [3, 3]
    target = 6
    result = two_sum(nums, target)
    print(result)  # Output: [0, 1]