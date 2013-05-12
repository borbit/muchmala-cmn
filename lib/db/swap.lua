local odd = function(num)
  return math.mod(num, 2) == 1
end

local band = function(a, b)
  local c, pow = 0, 1
  while a > 0 or b > 0
    do
      if odd(a) and odd(b)
        then
          c = c + pow
        end
      a = math.floor(a / 2)
      b = math.floor(b / 2)
      pow = pow * 2
    end
  return c
end

local piece1 = tonumber(redis.call('lindex', KEYS[1], KEYS[2]))
local piece2 = tonumber(redis.call('lindex', KEYS[1], KEYS[3]))

if band(piece1, 15) == band(piece2, 15)
  then
    redis.call('lset', KEYS[1], KEYS[2], piece2)
    redis.call('lset', KEYS[1], KEYS[3], piece1)
    return {KEYS[2], piece2, KEYS[3], piece1}
  else
    return redis.error_reply('Cannot swap')
  end